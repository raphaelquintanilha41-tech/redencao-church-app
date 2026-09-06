import { supabase } from './supabaseClient';

// ── Notificações push (Web Push) ─────────────────────────────────────
// Chave pública VAPID — segura para expor no cliente (a privada fica
// apenas no Supabase Vault, usada só pela edge function `send-push`).
const VAPID_PUBLIC_KEY =
  'BFmsDXWADz4Wdn9rTW5Xui9YD5hCNJQsvzGg5a-MRmj-EJj5rjiiS3V6hMBfpaKyNmE5uU2xw91lgtPCvceXQok';

export type PushSubscriptionState = 'unsupported' | 'denied' | 'subscribed' | 'not-subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushSubscriptionState(): Promise<PushSubscriptionState> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    return existing ? 'subscribed' : 'not-subscribed';
  } catch (err) {
    return 'not-subscribed';
  }
}

export async function subscribeToPush(userId: string): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Este navegador não suporta notificações push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificações não concedida.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Subscrição push inválida.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw error;
}

export async function updateAppBadge(unreadCount: number): Promise<void> {
  const nav = navigator as Navigator & {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (!nav.setAppBadge) return;
  try {
    if (unreadCount > 0) {
      await nav.setAppBadge(unreadCount);
    } else {
      await nav.clearAppBadge?.();
    }
  } catch (err) {
    // Badge API indisponível ou falhou — ignora silenciosamente.
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
  if (error) throw error;
}
