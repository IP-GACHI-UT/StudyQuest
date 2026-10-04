import nodemailer from 'nodemailer';

type ActionEmail = {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT ?? '1025', 10);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || Number.isNaN(port)) {
    throw new Error('SMTP_HOST and a valid SMTP_PORT are required.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: user && password ? { user, pass: password } : undefined,
  });

  return transporter;
}

export async function sendActionEmail(email: ActionEmail) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const from = process.env.MAIL_FROM;

  if (!from) {
    throw new Error('MAIL_FROM is required.');
  }

  const safeHeading = escapeHtml(email.heading);
  const safeMessage = escapeHtml(email.message);
  const safeActionLabel = escapeHtml(email.actionLabel);
  const safeActionUrl = escapeHtml(email.actionUrl);

  await getTransporter().sendMail({
    from,
    to: email.to,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    subject: email.subject,
    text: `${email.heading}\n\n${email.message}\n\n${email.actionLabel}: ${email.actionUrl}\n\nこのメールに心当たりがない場合は破棄してください。`,
    html: `
      <main style="max-width: 560px; margin: 0 auto; padding: 32px 20px; font-family: sans-serif; color: #172033;">
        <p style="font-size: 14px; font-weight: 700; color: #2563eb;">StudyQuest</p>
        <h1 style="font-size: 24px;">${safeHeading}</h1>
        <p style="line-height: 1.7;">${safeMessage}</p>
        <p style="margin: 32px 0;">
          <a href="${safeActionUrl}" style="display: inline-block; border-radius: 8px; background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; font-weight: 700;">${safeActionLabel}</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">このメールに心当たりがない場合は破棄してください。</p>
      </main>
    `,
  });
}
