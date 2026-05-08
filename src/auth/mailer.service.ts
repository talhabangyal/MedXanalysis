import nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.BREVO_SMTP_HOST;
    const port = Number(process.env.BREVO_SMTP_PORT || 587);
    const user = process.env.BREVO_SMTP_USER;
    const pass = process.env.BREVO_SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const from = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER;
    const info = await this.transporter.sendMail({
      from,
      to,
      subject,
      text: text || undefined,
      html,
    });
    return info;
  }
}

export function resetCodeTemplate(code: string) {
  return {
    subject: 'Your MedXAnalysis password reset code',
    html: `<div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.4;color:#0f172a;"><h2 style="color:#0f172a">MedXAnalysis — Password Reset</h2><p>We received a request to reset your password. Use the code below to continue. This code is valid for 5 minutes.</p><div style="margin:18px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;display:inline-block;font-weight:700;font-size:20px;letter-spacing:2px">${code}</div><p>If you didn't request this, you can safely ignore this message.</p><p>— MedXAnalysis team</p></div>`,
    text: `Your MedXAnalysis password reset code: ${code} (valid for 5 minutes)`
  };
}
