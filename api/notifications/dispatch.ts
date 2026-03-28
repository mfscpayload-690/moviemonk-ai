import type { VercelRequest, VercelResponse } from '../_utils/vercel';
import { applyCors } from '../_utils/cors';
import { beginRequestObservation } from '../_utils/observability';
import { sendApiError } from '../_utils/http';
import { getSupabaseAdminClient } from '../_utils/supabaseAdmin';
import { secureCompareSecret } from '../_utils/security';

type NotificationChannel = 'in_app' | 'email' | 'push';
type NotificationFrequency = 'daily' | 'weekly';

type PreferenceRow = {
  user_id: string;
  notification_channels: string[] | null;
  notification_frequency: string | null;
  notifications_enabled: boolean | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/notifications/dispatch');
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

  const dispatchSecret = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!dispatchSecret) {
    obs.finish(500, { error_code: 'dispatch_secret_not_configured' });
    return sendApiError(res, 500, 'dispatch_secret_not_configured', 'Notification dispatch secret is not configured');
  }

  const incomingSecret = req.headers['x-notification-secret'];
  const secretValue = Array.isArray(incomingSecret) ? incomingSecret[0] : incomingSecret;
  if (!secretValue || !secureCompareSecret(secretValue, dispatchSecret)) {
    obs.finish(401, { error_code: 'unauthorized_dispatch' });
    return sendApiError(res, 401, 'unauthorized_dispatch', 'Invalid dispatch secret');
  }

  const frequency = (req.query.frequency || req.body?.frequency || 'daily') as NotificationFrequency;
  if (!['daily', 'weekly'].includes(frequency)) {
    obs.finish(400, { error_code: 'invalid_frequency' });
    return sendApiError(res, 400, 'invalid_frequency', 'frequency must be daily or weekly');
  }

  try {
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
        ? row.notification_channels.filter((ch): ch is NotificationChannel => ch === 'in_app' || ch === 'email' || ch === 'push')
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
  } catch (error: any) {
    obs.finish(500, { error_code: 'notification_dispatch_failed' });
    return sendApiError(res, 500, 'notification_dispatch_failed', 'Notification dispatch failed');
  }
}
