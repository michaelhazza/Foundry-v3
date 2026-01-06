import { Resend } from 'resend';
import { env, features } from '../config/env';
import { logger } from '../lib/logger';

const resend = features.email ? new Resend(env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'Foundry <noreply@foundry.app>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html } = options;

  if (!resend) {
    // Log email to console in development/when email not configured
    logger.info({
      email: {
        to,
        subject,
        html: html.substring(0, 200) + '...',
      },
    }, 'Email would have been sent (email not configured)');
    return true;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, 'Email sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    return false;
  }
}

export function generateInvitationEmail(params: {
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're invited to join Foundry</h1>
          <p>${params.inviterName} has invited you to join <strong>${params.organizationName}</strong> on Foundry.</p>
          <p>Foundry is a platform for preparing AI training data from customer support conversations.</p>
          <p>
            <a href="${params.inviteUrl}" class="button">Accept Invitation</a>
          </p>
          <p class="footer">
            This invitation will expire in 7 days.<br>
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;
}

export function generatePasswordResetEmail(params: {
  resetUrl: string;
  userName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Your Password</h1>
          <p>Hi ${params.userName},</p>
          <p>We received a request to reset your password for your Foundry account.</p>
          <p>
            <a href="${params.resetUrl}" class="button">Reset Password</a>
          </p>
          <p class="footer">
            This link will expire in 1 hour.<br>
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;
}
