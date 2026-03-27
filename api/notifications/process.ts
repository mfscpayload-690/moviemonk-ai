import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_utils/cors';
import { beginRequestObservation } from '../_utils/observability';
import { sendApiError } from '../_utils/http';
import { getSupabaseAdminClient } from '../_utils/supabaseAdmin';

type NotificationRow = {
  id: string;
  user_id: string;
  channel: 'in_app' | 'email' | 'push';
  event_type: 'digest' | 'recommendation' | 'watchlist_reminder' | 'release_alert';
  payload: { title?: string; message?: string } | null;
};

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!resendApiKey || !from) {
    throw new Error('Email provider not configured. Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/notifications/process');
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

  const processSecret = process.env.NOTIFICATION_DISPATCH_SECRET;
  const incomingHeader = req.headers['x-notification-secret'];
  const headerSecret = Array.isArray(incomingHeader) ? incomingHeader[0] : incomingHeader;
  const querySecret = (req.query.secret as string) || req.body?.secret;
  if (processSecret && headerSecret !== processSecret && querySecret !== processSecret) {
    obs.finish(401, { error_code: 'unauthorized_process' });
    return sendApiError(res, 401, 'unauthorized_process', 'Invalid processing secret');
  }

  const limit = Math.max(1, Math.min(200, Number(req.query.limit || req.body?.limit || 50)));

  try {
    const supabase = getSupabaseAdminClient();
    const { data: queued, error: queueError } = await (supabase
      .from('notification_events') as any)
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

          await sendEmail(
            email,
            item.payload?.title || 'MovieMonk notification',
            item.payload?.message || 'You have an update from MovieMonk.'
          );

          const { error } = await (supabase.from('notification_events') as any)
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', item.id);
          if (error) throw error;
          sent += 1;
          continue;
        }

        // Push provider wiring placeholder
        throw new Error('Push provider is not configured yet.');
      } catch (err: any) {
        failed += 1;
        await (supabase.from('notification_events') as any)
          .update({
            status: 'failed',
            payload: {
              ...item.payload,
              last_error: err?.message || 'Unknown processing error'
            }
          })
          .eq('id', item.id);
      }
    }

    obs.finish(200, { processed: rows.length, sent, failed });
    return res.status(200).json({ ok: true, processed: rows.length, sent, failed });
  } catch (error: any) {
    obs.finish(500, { error_code: 'notification_process_failed' });
    return sendApiError(res, 500, 'notification_process_failed', error?.message || 'Unknown error');
  }
}
