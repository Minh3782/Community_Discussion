import nodemailer from 'nodemailer';

/**
 * Sends email through SMTP when SMTP_HOST is configured in .env.
 * Otherwise (local development) the message is printed to the server console,
 * so the password-reset link can still be clicked from there.
 */
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`\n--- EMAIL (dev, not sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n-----------------------------\n`);
    return;
  }
  await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
}
