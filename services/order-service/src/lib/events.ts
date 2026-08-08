const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

export async function getCustomerInfo(userId: string): Promise<{ email: string; name: string; phone?: string } | null> {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/users/${userId}`);
    if (!res.ok) return null;
    const data = await res.json() as { user?: { email?: string; name?: string; phone?: string } };
    if (!data.user?.email) return null;
    return {
      email: data.user.email,
      name: data.user.name || data.user.email.split('@')[0],
      phone: data.user.phone,
    };
  } catch { return null; }
}

export function publishOrderEvent(payload: {
  event: 'ORDER_PLACED' | 'ORDER_STATUS_UPDATED' | 'ORDER_CANCELLED';
  orderId: string;
  storeId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status?: string;
  total?: number;
}): void {
  fetch(`${NOTIFICATION_SERVICE_URL}/notify/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-store-id': payload.storeId },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget — never block the order response
}
