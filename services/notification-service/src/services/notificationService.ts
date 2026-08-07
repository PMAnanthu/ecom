import { sendEmail } from '../lib/email';
import { sendWhatsApp } from '../lib/whatsapp';
import { prisma } from '../lib/prisma';

export type NotifEvent =
  | 'ORDER_PLACED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_CANCELLED';

type OrderPayload = {
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  status?: string;
  total?: number;
  storeId: string;
};

export async function notifyOrderEvent(event: NotifEvent, payload: OrderPayload): Promise<void> {
  const config = await prisma.notificationConfig.findUnique({ where: { storeId: payload.storeId } });
  if (!config) return;

  const subject = buildSubject(event, payload);
  const html = buildEmailHtml(event, payload);
  const waMessage = buildWaMessage(event, payload);

  const tasks: Promise<void>[] = [];

  if (config.emailEnabled && payload.customerEmail) {
    tasks.push(
      sendEmail({ storeId: payload.storeId, to: payload.customerEmail, subject, html, event })
        .catch(err => logFailure(payload.storeId, 'EMAIL', event, payload.customerEmail, err))
    );
  }

  if (config.waEnabled && payload.customerPhone) {
    tasks.push(
      sendWhatsApp({ storeId: payload.storeId, to: payload.customerPhone, message: waMessage, event })
        .catch(err => logFailure(payload.storeId, 'WHATSAPP', event, payload.customerPhone!, err))
    );
  }

  await Promise.all(tasks);
}

async function logFailure(storeId: string, channel: 'EMAIL' | 'WHATSAPP', event: string, recipient: string, err: unknown) {
  await prisma.notificationLog.create({
    data: { storeId, channel, event, recipient, status: 'FAILED', error: String(err) },
  }).catch(() => {});
}

function buildSubject(event: NotifEvent, p: OrderPayload): string {
  if (event === 'ORDER_PLACED') return `Order confirmed — #${p.orderId.slice(-8).toUpperCase()}`;
  if (event === 'ORDER_STATUS_UPDATED') return `Your order status: ${p.status}`;
  return `Order cancelled — #${p.orderId.slice(-8).toUpperCase()}`;
}

function buildEmailHtml(event: NotifEvent, p: OrderPayload): string {
  if (event === 'ORDER_PLACED') {
    return `<h2>Hi ${p.customerName}, your order is confirmed!</h2>
<p>Order ID: <strong>${p.orderId}</strong></p>
<p>Total: <strong>$${p.total?.toFixed(2)}</strong></p>
<p>We'll notify you when it ships.</p>`;
  }
  if (event === 'ORDER_STATUS_UPDATED') {
    return `<h2>Hi ${p.customerName}, your order status has been updated.</h2>
<p>Order ID: <strong>${p.orderId}</strong></p>
<p>New status: <strong>${p.status}</strong></p>`;
  }
  return `<h2>Hi ${p.customerName}, your order has been cancelled.</h2>
<p>Order ID: <strong>${p.orderId}</strong></p>
<p>If you have questions, please contact support.</p>`;
}

function buildWaMessage(event: NotifEvent, p: OrderPayload): string {
  if (event === 'ORDER_PLACED') {
    return `Hi ${p.customerName}! Your order #${p.orderId.slice(-8).toUpperCase()} is confirmed. Total: $${p.total?.toFixed(2)}. We'll keep you updated!`;
  }
  if (event === 'ORDER_STATUS_UPDATED') {
    return `Hi ${p.customerName}! Your order #${p.orderId.slice(-8).toUpperCase()} status is now: ${p.status}.`;
  }
  return `Hi ${p.customerName}. Your order #${p.orderId.slice(-8).toUpperCase()} has been cancelled. Contact support for help.`;
}
