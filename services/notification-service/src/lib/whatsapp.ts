import { prisma } from './prisma';

export async function sendWhatsApp(opts: {
  storeId: string;
  to: string;
  message: string;
  event: string;
}): Promise<void> {
  const config = await prisma.notificationConfig.findUnique({ where: { storeId: opts.storeId } });
  if (!config?.waEnabled || !config.waApiKey || !config.waPhoneId) {
    throw new Error('WhatsApp not configured for this store');
  }

  if (config.waProvider === 'META') {
    await sendViaMeta({ apiKey: config.waApiKey, phoneId: config.waPhoneId, to: opts.to, message: opts.message });
  } else {
    await sendViaTwilio({ apiKey: config.waApiKey, from: config.waPhoneId, to: opts.to, message: opts.message });
  }

  await prisma.notificationLog.create({
    data: {
      storeId: opts.storeId,
      channel: 'WHATSAPP',
      event: opts.event,
      recipient: opts.to,
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}

async function sendViaMeta(opts: { apiKey: string; phoneId: string; to: string; message: string }) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${opts.phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: opts.to,
      type: 'text',
      text: { body: opts.message },
    }),
  });
  if (!res.ok) throw new Error(`Meta WhatsApp error: ${res.status}`);
}

async function sendViaTwilio(opts: { apiKey: string; from: string; to: string; message: string }) {
  const [accountSid, authToken] = opts.apiKey.split(':');
  const body = new URLSearchParams({
    From: `whatsapp:${opts.from}`,
    To: `whatsapp:${opts.to}`,
    Body: opts.message,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Twilio error: ${res.status}`);
}
