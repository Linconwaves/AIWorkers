import fetch from 'node-fetch';
import { getConfig } from '../config';

export async function sendResetEmail(to: string, code: string) {
  const config = getConfig();
  const apiKey = config.RESEND_API_KEY;
  const from = config.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Email sending is not configured');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your StoreCanvas reset code',
      text: `Use this code to reset your password: ${code}\n\nThis code expires in 15 minutes.`
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Failed to send reset email (${res.status}): ${detail}`);
  }
}
