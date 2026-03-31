import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';
import { beginRequestObservation } from './_utils/observability';
import { sendApiError } from './_utils/http';
import { getSupabaseAdminClient } from './_utils/supabaseAdmin';
import { secureCompareSecret } from './_utils/security';
import webpush from 'web-push';

// ─── Shared Types ─────────────────────────────────────────────────────────────

type NotificationChannel = 'in_app' | 'email' | 'push';
type NotificationFrequency = 'daily' | 'weekly';

type PreferenceRow = {
  user_id: string;
  notification_channels: string[] | null;
  notification_frequency: string | null;
  notifications_enabled: boolean | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  event_type: 'digest' | 'recommendation' | 'watchlist_reminder' | 'release_alert';
  payload: { title?: string; message?: string } | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// ─── VAPID / Email helpers ─────────────────────────────────────────────────────

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@moviemonk.app';
  if (!publicKey || !privateKey) {
    throw new Error('Push provider not configured. Set VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!resendApiKey || !from) {
    throw new Error('Email provider not configured. Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<p>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed: ${response.status} ${text}`);
  }
}

// ─── Auth helper (shared by both actions) ─────────────────────────────────────

function checkSecret(req: VercelRequest, res: VercelResponse, obs: any): boolean {
  const secret = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!secret) {
    obs.finish(500, { error_code: 'dispatch_secret_not_configured' });
    sendApiError(res, 500, 'dispatch_secret_not_configured', 'Notification dispatch secret is not configured');
    return false;
  }
  const incoming = req.headers['x-notification-secret'];
  const incoming_val = Array.isArray(incoming) ? incoming[0] : incoming;
  if (!incoming_val || !secureCompareSecret(incoming_val, secret)) {
    obs.finish(401, { error_code: 'unauthorized' });
    sendApiError(res, 401, 'unauthorized', 'Invalid secret');
    return false;
  }
  return true;
}

// ─── Action: dispatch ─────────────────────────────────────────────────────────

async function handleDispatch(req: VercelRequest, res: VercelResponse, obs: any) {
  const frequency = (req.query.frequency || req.body?.frequency || 'daily') as NotificationFrequency;
  if (!['daily', 'weekly'].includes(frequency)) {
    obs.finish(400, { error_code: 'invalid_frequency' });
    return sendApiError(res, 400, 'invalid_frequency', 'frequency must be daily or weekly');
  }

  const supabase = getSupabaseAdminClient();
  const { data: rows, error: prefError } = await supabase
    .from('user_preferences')
    .select('user_id, notification_channels, notification_frequency, notifications_enabled')
    .eq('notifications_enabled', true)
    .eq('notification_frequency', frequency);

  if (prefError) {
    obs.finish(500, { error_code: 'preferences_fetch_failed' });
    return sendApiError(res, 500, 'preferences_fetch_failed', prefError.message);
  }

  const targetUsers = (rows || []) as PreferenceRow[];
  if (targetUsers.length === 0) {
    obs.finish(200, { queued: 0, recipients: 0, frequency });
    return res.status(200).json({ ok: true, queued: 0, recipients: 0, frequency });
  }

  const now = new Date().toISOString();
  const events = targetUsers.flatMap((row) => {
    const channels = Array.isArray(row.notification_channels)
      ? row.notification_channels.filter((ch): ch is NotificationChannel =>
          ch === 'in_app' || ch === 'email' || ch === 'push')
      : [];
    return channels.map((channel) => ({
      user_id: row.user_id,
      channel,
      frequency,
      event_type: 'digest',
      status: 'queued',
      payload: {
        title: 'Your MovieMonk digest is ready',
        message: `Fresh recommendations are ready for your ${frequency} digest.`,
        generated_at: now
      }
    }));
  });

  if (events.length === 0) {
    obs.finish(200, { queued: 0, recipients: targetUsers.length, frequency });
    return res.status(200).json({ ok: true, queued: 0, recipients: targetUsers.length, frequency });
  }

  const { error: insertError } = await (supabase.from('notification_events') as any).insert(events);
  if (insertError) {
    obs.finish(500, { error_code: 'notification_queue_insert_failed' });
    return sendApiError(res, 500, 'notification_queue_insert_failed', insertError.message);
  }

  obs.finish(200, { queued: events.length, recipients: targetUsers.length, frequency });
  return res.status(200).json({ ok: true, queued: events.length, recipients: targetUsers.length, frequency });
}

// ─── Action: process ──────────────────────────────────────────────────────────

async function handleProcess(req: VercelRequest, res: VercelResponse, obs: any) {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit || req.body?.limit || 50)));
  const supabase = getSupabaseAdminClient();

  const { data: queued, error: queueError } = await (supabase.from('notification_events') as any)
    .select('id, user_id, channel, event_type, payload')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (queueError) {
    obs.finish(500, { error_code: 'queue_fetch_failed' });
    return sendApiError(res, 500, 'queue_fetch_failed', queueError.message);
  }

  const rows = (queued || []) as NotificationRow[];
  let sent = 0;
  let failed = 0;

  for (const item of rows) {
    try {
      if (item.channel === 'in_app') {
        const { error } = await (supabase.from('notification_events') as any)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
        sent += 1;
        continue;
      }

      if (item.channel === 'email') {
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(item.user_id);
        if (userErr) throw userErr;
        const email = userData?.user?.email;
        if (!email) throw new Error('No email for user');
        await sendEmail(email, item.payload?.title || 'MovieMonk notification', item.payload?.message || 'You have an update.');
        const { error } = await (supabase.from('notification_events') as any)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
        sent += 1;
        continue;
      }

      if (item.channel === 'push') {
        ensureVapidConfigured();
        const { data: subs, error: subError } = await (supabase.from('push_subscriptions') as any)
          .select('endpoint, p256dh, auth')
          .eq('user_id', item.user_id);
        if (subError) throw subError;

        const subscriptions = (subs || []) as PushSubscriptionRow[];
        if (subscriptions.length === 0) throw new Error('No push subscriptions found for user.');

        let delivered = 0;
        for (const sub of subscriptions) {
          const payload = JSON.stringify({
            title: item.payload?.title || 'MovieMonk notification',
            body: item.payload?.message || 'You have an update from MovieMonk.',
            data: { url: '/' }
          });
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
            delivered += 1;
          } catch (pushErr: any) {
            const status = pushErr?.statusCode;
            if (status === 404 || status === 410) {
              await (supabase.from('push_subscriptions') as any)
                .delete().eq('user_id', item.user_id).eq('endpoint', sub.endpoint);
            }
          }
        }
        if (delivered === 0) throw new Error('Push delivery failed for all subscriptions.');
        const { error } = await (supabase.from('notification_events') as any)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
        sent += 1;
        continue;
      }

      throw new Error(`Unsupported notification channel: ${item.channel}`);
    } catch (err: any) {
      failed += 1;
      await (supabase.from('notification_events') as any)
        .update({ status: 'failed', payload: { ...item.payload, last_error: err?.message || 'Unknown error' } })
        .eq('id', item.id);
    }
  }

  obs.finish(200, { processed: rows.length, sent, failed });
  return res.status(200).json({ ok: true, processed: rows.length, sent, failed });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || '';
  const obs = beginRequestObservation(req, res, `/api/notifications?action=${action}`);
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }
  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  if (!checkSecret(req, res, obs)) return;

  try {
    if (action === 'dispatch') return await handleDispatch(req, res, obs);
    if (action === 'process') return await handleProcess(req, res, obs);
    obs.finish(400, { error_code: 'invalid_action' });
    return sendApiError(res, 400, 'invalid_action', 'action must be dispatch or process');
  } catch (error: any) {
    obs.finish(500, { error_code: 'notification_handler_failed' });
    return sendApiError(res, 500, 'notification_handler_failed', 'Notification handler failed');
  }
}
