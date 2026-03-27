import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type InAppNotification = {
  id: string;
  eventType: string;
  status: 'queued' | 'sent' | 'failed';
  title: string;
  message: string;
  createdAt: string;
  sentAt?: string | null;
};

export async function fetchInAppNotifications(userId: string): Promise<InAppNotification[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('notification_events')
    .select('id, event_type, status, payload, created_at, sent_at')
    .eq('user_id', userId)
    .eq('channel', 'in_app')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    eventType: row.event_type,
    status: row.status,
    title: row.payload?.title || 'MovieMonk update',
    message: row.payload?.message || 'You have a new notification.',
    createdAt: row.created_at,
    sentAt: row.sent_at
  }));
}
