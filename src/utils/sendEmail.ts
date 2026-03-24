import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: env.EMAIL_SECURE === 'true',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
};

const LOGO_SVG = `<svg width="120" height="130" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Watercolor teal-green gradients for canopy blobs -->
    <radialGradient id="g1" cx="40%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#7ecfb3" stop-opacity="1"/>
      <stop offset="60%" stop-color="#3a9e7e" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1d6b52" stop-opacity="0.7"/>
    </radialGradient>
    <radialGradient id="g2" cx="60%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#a8dfc9" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#52b78a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#2d7a5c" stop-opacity="0.7"/>
    </radialGradient>
    <radialGradient id="g3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#5ec49a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1a5c42" stop-opacity="0.8"/>
    </radialGradient>
    <!-- Soft blur for watercolor feel -->
    <filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
    <filter id="wc2" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>

  <!-- ── Watercolor canopy blobs (back layer, blurred) ── -->
  <ellipse cx="42" cy="38" rx="30" ry="26" fill="url(#g1)" filter="url(#wc)"/>
  <ellipse cx="78" cy="34" rx="27" ry="23" fill="url(#g2)" filter="url(#wc)"/>
  <ellipse cx="60" cy="26" rx="25" ry="21" fill="url(#g3)" filter="url(#wc)"/>

  <!-- ── Canopy blobs (mid layer, sharper) ── -->
  <ellipse cx="38" cy="36" rx="22" ry="18" fill="#4db896" opacity="0.75" filter="url(#wc2)"/>
  <ellipse cx="80" cy="32" rx="20" ry="17" fill="#6dcfaa" opacity="0.7" filter="url(#wc2)"/>
  <ellipse cx="60" cy="24" rx="20" ry="16" fill="#3aaa82" opacity="0.8" filter="url(#wc2)"/>
  <ellipse cx="52" cy="30" rx="14" ry="12" fill="#8adcbc" opacity="0.55"/>
  <ellipse cx="70" cy="28" rx="13" ry="11" fill="#5ec49a" opacity="0.5"/>

  <!-- ── Scattered leaf dots ── -->
  <circle cx="22" cy="28" r="4" fill="#7ecfb3" opacity="0.7"/>
  <circle cx="98" cy="24" r="3.5" fill="#6dcfaa" opacity="0.65"/>
  <circle cx="18" cy="40" r="3" fill="#4db896" opacity="0.6"/>
  <circle cx="102" cy="38" r="3.5" fill="#52b78a" opacity="0.6"/>
  <circle cx="60" cy="10" r="3" fill="#a8dfc9" opacity="0.6"/>
  <circle cx="30" cy="18" r="2.5" fill="#8adcbc" opacity="0.55"/>
  <circle cx="90" cy="16" r="2.5" fill="#7ecfb3" opacity="0.55"/>

  <!-- ── Tree trunk ── -->
  <path d="M60 82 Q59 70 60 58 Q60 50 60 42"
        stroke="#1a3d2b" stroke-width="4" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- ── Primary branches ── -->
  <path d="M60 58 Q50 50 38 40" stroke="#1a3d2b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 54 Q70 46 82 36" stroke="#1a3d2b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 64 Q50 57 44 50" stroke="#1a3d2b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M60 64 Q70 57 76 50" stroke="#1a3d2b" stroke-width="2.2" fill="none" stroke-linecap="round"/>

  <!-- ── Secondary branches ── -->
  <path d="M38 40 Q30 32 26 24" stroke="#2d6a4f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M82 36 Q90 28 94 20" stroke="#2d6a4f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M44 50 Q38 42 34 34" stroke="#2d6a4f" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M76 50 Q82 42 86 34" stroke="#2d6a4f" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M38 40 Q34 36 30 30" stroke="#2d6a4f" stroke-width="1" fill="none" stroke-linecap="round"/>
  <path d="M82 36 Q86 32 90 26" stroke="#2d6a4f" stroke-width="1" fill="none" stroke-linecap="round"/>

  <!-- ── LEFT cupped hand ── -->
  <!-- Palm curve -->
  <path d="M14 92 Q8 82 12 74 Q16 66 24 70 Q30 73 32 80 L42 80 Q48 80 52 76 L60 76"
        stroke="#1a3d2b" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Left fingers (4 fingers) -->
  <path d="M16 76 Q13 68 17 64" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M22 72 Q20 64 24 60" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M28 70 Q27 62 32 59" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M34 70 Q34 62 38 60" stroke="#2d6a4f" stroke-width="1.4" fill="none" stroke-linecap="round"/>

  <!-- ── RIGHT cupped hand ── -->
  <!-- Palm curve -->
  <path d="M106 92 Q112 82 108 74 Q104 66 96 70 Q90 73 88 80 L78 80 Q72 80 68 76 L60 76"
        stroke="#1a3d2b" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Right fingers (4 fingers) -->
  <path d="M104 76 Q107 68 103 64" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M98 72 Q100 64 96 60" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M92 70 Q93 62 88 59" stroke="#2d6a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M86 70 Q86 62 82 60" stroke="#2d6a4f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</svg>`;

// ─── Premium email wrapper template ──────────────────────────────────────────
const emailTemplate = (title: string, bodyContent: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#d8ede4;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#d8ede4;padding:40px 16px;">
    <tr><td align="center">

      <!-- ── Outer card ── -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;
                    box-shadow:0 8px 40px rgba(0,0,0,0.13);">

        <!-- ══ HEADER ══ -->
        <tr>
          <td style="
            background-color:#1b4332;
            background-image:
              radial-gradient(ellipse 220px 160px at -5% 130%, #40916c 50%, transparent 62%),
              radial-gradient(ellipse 180px 140px at 108% -20%, #2d6a4f 48%, transparent 60%),
              radial-gradient(ellipse 150px 110px at 90% 130%, #52b788 42%, transparent 55%),
              radial-gradient(ellipse 120px 90px  at 10%  -15%, #1b4332 55%, transparent 65%);
            padding:48px 30px 36px;
            text-align:center;
          ">
            <!-- Logo circle -->
            <div style="
              display:inline-block;
              background:rgba(255,255,255,0.08);
              border:1.5px solid rgba(255,255,255,0.15);
              border-radius:50%;
              padding:18px 20px 14px;
              box-shadow:0 6px 28px rgba(0,0,0,0.3);
              margin-bottom:18px;
            ">
              ${LOGO_SVG}
            </div>

            <!-- Brand name -->
            <div style="
              color:#ffffff;
              font-size:28px;
              font-weight:800;
              letter-spacing:4px;
              text-transform:uppercase;
              text-shadow:0 2px 10px rgba(0,0,0,0.35);
              margin-bottom:6px;
            ">MY EMDR</div>

            <!-- Decorative divider -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding:0 0 8px;">
                  <div style="
                    width:60px;height:2px;
                    background:linear-gradient(90deg,transparent,#74c69d,transparent);
                    margin:0 auto;
                  "></div>
                </td>
              </tr>
            </table>

            <div style="
              color:#95d5b2;
              font-size:11px;
              letter-spacing:3px;
              text-transform:uppercase;
              font-weight:500;
            ">Psychology &amp; Wellness</div>
          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td style="background:#ffffff;padding:40px 44px 36px;">
            ${bodyContent}
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td style="
            background-color:#f2f9f5;
            background-image:
              radial-gradient(ellipse 200px 100px at 105% 0%,   #b7e4c7 45%, transparent 58%),
              radial-gradient(ellipse 150px 90px  at -5%  110%, #95d5b2 40%, transparent 52%);
            padding:22px 30px;
            text-align:center;
            border-top:1px solid #e0f0e8;
          ">
            <p style="margin:0 0 4px;color:#52796f;font-size:12px;font-weight:500;">
              © ${new Date().getFullYear()} MY EMDR. All rights reserved.
            </p>
            <p style="margin:0;color:#95aaa3;font-size:11px;">
              This is an automated message — please do not reply directly to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (env.NODE_ENV === 'development' && !env.EMAIL_USER) {
      console.log('📧 [DEV MODE] Email would be sent to:', options.to);
      console.log('📧 [DEV MODE] Subject:', options.subject);
      return;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME || 'MY EMDR'}" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`📧 Email sent to ${options.to} — ID: ${info.messageId}`);
    console.log('✅ Accepted:', info.accepted);
    if (info.rejected?.length) console.warn('❌ Rejected:', info.rejected);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    if (env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing in development mode despite email failure');
      return;
    }
    throw new Error('Failed to send email');
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  firstName: string,
): Promise<void> => {
  const body = `
    <h2 style="margin:0 0 8px;color:#1b4332;font-size:22px;font-weight:700;">
      Welcome, ${firstName}! 👋
    </h2>
    <p style="margin:0 0 24px;color:#4a6b5a;font-size:15px;line-height:1.6;">
      Thanks for signing up. Use the verification code below to confirm your email address.
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
      <tr><td align="center">
        <div style="
          background:linear-gradient(145deg,#f0faf5,#e4f5ec);
          border:2px dashed #52b788;
          border-radius:14px;
          padding:30px 24px;
          text-align:center;
        ">
          <p style="margin:0 0 10px;color:#52796f;font-size:12px;
                    text-transform:uppercase;letter-spacing:2px;font-weight:600;">
            Your Verification Code
          </p>
          <div style="
            font-size:42px;font-weight:800;color:#1b4332;
            letter-spacing:12px;font-family:'Courier New',monospace;
            text-shadow:0 2px 6px rgba(27,67,50,0.15);
          ">${otp}</div>
          <p style="margin:12px 0 0;color:#74c69d;font-size:13px;font-weight:500;">
            ⏱&nbsp; Expires in <strong>10 minutes</strong>
          </p>
        </div>
      </td></tr>
    </table>

    <!-- Security notice -->
    <div style="
      background:#fffbf0;
      border-left:4px solid #f4a261;
      border-radius:0 8px 8px 0;
      padding:14px 18px;
      margin-bottom:24px;
    ">
      <strong style="color:#c1440e;font-size:13px;">⚠️ Security Notice:</strong>
      <span style="color:#6b5a3e;font-size:13px;">
        &nbsp;Never share this code with anyone. MY EMDR will never ask for your OTP.
      </span>
    </div>

    <p style="margin:0 0 6px;color:#8a9e96;font-size:13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="margin:24px 0 0;color:#4a6b5a;font-size:14px;">
      Warm regards,<br/>
      <strong style="color:#1b4332;">The MY EMDR Team</strong>
    </p>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email — MY EMDR',
    text: `Hi ${firstName}, your verification code is: ${otp}. Valid for 10 minutes.`,
    html: emailTemplate('Verify Your Email — MY EMDR', body),
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  firstName: string,
): Promise<void> => {
  const body = `
    <h2 style="margin:0 0 8px;color:#1b4332;font-size:22px;font-weight:700;">
      Password Reset Request 🔐
    </h2>
    <p style="margin:0 0 24px;color:#4a6b5a;font-size:15px;line-height:1.6;">
      Hi ${firstName}, we received a request to reset your password.
      Use the code below to proceed. If this wasn't you, no action is needed.
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
      <tr><td align="center">
        <div style="
          background:linear-gradient(145deg,#f0faf5,#e4f5ec);
          border:2px dashed #52b788;
          border-radius:14px;
          padding:30px 24px;
          text-align:center;
        ">
          <p style="margin:0 0 10px;color:#52796f;font-size:12px;
                    text-transform:uppercase;letter-spacing:2px;font-weight:600;">
            Your Recovery Code
          </p>
          <div style="
            font-size:42px;font-weight:800;color:#1b4332;
            letter-spacing:12px;font-family:'Courier New',monospace;
            text-shadow:0 2px 6px rgba(27,67,50,0.15);
          ">${otp}</div>
          <p style="margin:12px 0 0;color:#74c69d;font-size:13px;font-weight:500;">
            ⏱&nbsp; Expires in <strong>10 minutes</strong>
          </p>
        </div>
      </td></tr>
    </table>

    <!-- Security notice -->
    <div style="
      background:#fffbf0;
      border-left:4px solid #f4a261;
      border-radius:0 8px 8px 0;
      padding:14px 18px;
      margin-bottom:24px;
    ">
      <strong style="color:#c1440e;font-size:13px;">⚠️ Security Notice:</strong>
      <span style="color:#6b5a3e;font-size:13px;">
        &nbsp;If you didn't request this reset, your account is safe — just ignore this email.
      </span>
    </div>

    <p style="margin:24px 0 0;color:#4a6b5a;font-size:14px;">
      Warm regards,<br/>
      <strong style="color:#1b4332;">The MY EMDR Team</strong>
    </p>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password — MY EMDR',
    text: `Hi ${firstName}, your password reset code is: ${otp}. Valid for 10 minutes.`,
    html: emailTemplate('Reset Your Password — MY EMDR', body),
  });
};
