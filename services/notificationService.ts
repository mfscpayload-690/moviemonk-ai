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

function base64UrlToUint8Array(base64UrlString: string): Uint8Array {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function assertPushSupport() {
  if (typeof window === 'undefined') throw new Error('Push setup requires a browser environment.');
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported by this browser.');
  if (!('PushManager' in window)) throw new Error('Push notifications are not supported by this browser.');
}

export async function hasPushSubscription(): Promise<boolean> {
  assertPushSupport();
  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}

export async function enablePushNotifications(userId: string): Promise<void> {
  assertPushSupport();
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is missing.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Push notification permission was denied.');
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Keep as string for broad TS lib compatibility across CI environments.
      applicationServerKey: vapidPublicKey
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Push subscription payload is incomplete.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint,
    p256dh,
    auth,
    expiration_time: typeof json.expirationTime === 'number' ? json.expirationTime : null,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,endpoint' });

  if (error) throw error;
}

export async function disablePushNotifications(userId: string): Promise<void> {
  assertPushSupport();
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const subscription = await registration.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe();
  }

  if (endpoint) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
    if (error) throw error;
  }
}
