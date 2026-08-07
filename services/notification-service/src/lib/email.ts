import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function sendEmail(opts: {
  storeId?: string;
  to: string;
  subject: string;
  html: string;
  event: string;
}): Promise<void> {
  const config = await prisma.notificationConfig.findUnique({ where: { id: 'global' } });
  if (!config?.emailEnabled || !config.smtpHost) {
    throw new Error('Email not configured');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    auth: { user: config.smtpUser ?? '', pass: config.smtpPassword ?? '' },
  });

  await transporter.sendMail({
    from: config.smtpFrom ?? config.smtpUser ?? '',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  await prisma.notificationLog.create({
    data: {
      storeId: opts.storeId,
      channel: 'EMAIL',
      event: opts.event,
      recipient: opts.to,
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}
