/**
 * Email Service
 * Handles all email communications for the application
 * Using Brevo (formerly Sendinblue) as the email service provider
 * 
 * All templates are responsive and work on desktop/mobile email clients.
 */

import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];
type UserProfile = Database['public']['Tables']['users_profile']['Row'];

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

// ==================== CONFIGURATION ====================
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Universal sender email - all emails (bookings, reminders, cancellations) come from this address
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'book@bookagreed.com';
const EMAIL_FROM_NAME = import.meta.env.VITE_EMAIL_FROM_NAME || 'BookAgreed';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'book@bookagreed.com';
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const APP_NAME = import.meta.env.VITE_APP_NAME || 'BookAgreed';

// ==================== RESPONSIVE EMAIL BASE TEMPLATE ====================
/**
 * Base responsive email wrapper that works across all email clients
 * Uses table-based layout for maximum compatibility
 */
function emailWrapper(content: string, accentColor: string = '#3b82f6'): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * { box-sizing: border-box; }
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Header */
    .email-header {
      background: #ffffff;
      padding: 32px 24px;
      border-radius: 12px 12px 0 0;
      border-bottom: 4px solid ${accentColor};
    }
    
    .email-header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    
    .email-header p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    /* Content */
    .email-content {
      background: #ffffff;
      padding: 32px 24px;
    }
    
    .email-content h2 {
      margin: 24px 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .email-content p {
      margin: 0 0 16px 0;
    }
    
    /* Info box */
    .info-box {
      background: #f0f9ff;
      padding: 20px;
      border-left: 4px solid ${accentColor};
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    
    .info-box p {
      margin: 8px 0;
    }
    
    .info-box p:first-child {
      margin-top: 0;
    }
    
    .info-box p:last-child {
      margin-bottom: 0;
    }
    
    /* Success box */
    .success-box {
      background: #dcfce7;
      border-left-color: #16a34a;
    }
    
    /* Warning box */
    .warning-box {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }
    
    /* Error/Cancel box */
    .error-box {
      background: #fee2e2;
      border-left-color: #ef4444;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin: 8px 8px 8px 0;
      text-align: center;
    }
    
    .button:hover {
      opacity: 0.9;
    }
    
    .button-secondary {
      background: #e5e7eb;
      color: #374151 !important;
    }
    
    .button-success {
      background: #16a34a;
    }
    
    .button-danger {
      background: #ef4444;
    }
    
    /* Footer */
    .email-footer {
      background: #f9fafb;
      padding: 24px;
      border-radius: 0 0 12px 12px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    
    .email-footer a {
      color: ${accentColor};
      text-decoration: none;
    }
    
    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
      }
      
      .email-header,
      .email-content,
      .email-footer {
        padding: 24px 16px !important;
        border-radius: 0 !important;
      }
      
      .email-header h1 {
        font-size: 20px !important;
      }
      
      .button {
        display: block !important;
        width: 100% !important;
        margin: 8px 0 !important;
      }
      
      .info-box {
        padding: 16px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="margin: 0 auto; max-width: 600px; width: 100%;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper to format date/time with timezone
 */
function formatDateTime(dateString: string, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options,
  });
}

function formatTime(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

function formatShortDate(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(
  booking: Booking,
  eventType: EventType,
  guestEmail: string,
  guestName: string,
  host: UserProfile
) {
  const confirmationHtml = generateBookingConfirmationEmail({
    guestName,
    eventTitle: eventType.title,
    eventDescription: eventType.description || undefined,
    startTime: booking.start_time,
    endTime: booking.end_time,
    timezone: booking.guest_time_zone,
    location: eventType.location_value || 'To be confirmed',
    cancelUrl: `${APP_URL}/cancel/${booking.cancel_token}`,
    rescheduleUrl: `${APP_URL}/reschedule/${booking.reschedule_token}`,
    hostName: host.full_name || 'Your host',
    isPaid: eventType.is_paid || false,
    paymentLink: eventType.payment_link || undefined,
    paymentInstructions: eventType.payment_instructions || undefined,
    companyName: host.company_name || null,
  });

  return sendEmail({
    to: guestEmail,
    subject: `Booking Confirmed: ${eventType.title}`,
    html: confirmationHtml,
    replyTo: host.email,
  });
}

/**
 * Send booking confirmation email to host
 */
export async function sendBookingNotificationToHost(
  booking: Booking,
  eventType: EventType,
  guestName: string,
  guestEmail: string,
  host: UserProfile
) {
  const notificationHtml = generateHostNotificationEmail({
    hostName: host.full_name || 'there',
    guestName,
    guestEmail,
    eventTitle: eventType.title,
    startTime: booking.start_time,
    endTime: booking.end_time,
    timezone: booking.guest_time_zone,
    dashboardUrl: `${APP_URL}/dashboard`,
    companyName: host.company_name || null,
  });

  return sendEmail({
    to: host.email,
    subject: `New Booking: ${eventType.title}`,
    html: notificationHtml,
  });
}

/**
 * Send reschedule notification to guest
 */
export async function sendRescheduleConfirmation(
  oldBooking: Booking,
  newBooking: Booking,
  eventType: EventType,
  guestEmail: string,
  guestName: string,
  host: UserProfile
) {
  const rescheduleHtml = generateRescheduleEmail({
    guestName,
    eventTitle: eventType.title,
    oldStartTime: oldBooking.start_time,
    oldEndTime: oldBooking.end_time,
    newStartTime: newBooking.start_time,
    newEndTime: newBooking.end_time,
    timezone: newBooking.guest_time_zone,
    location: eventType.location_value || 'To be confirmed',
    cancelUrl: `${APP_URL}/cancel/${newBooking.cancel_token}`,
    hostName: host.full_name || 'Your host',
    companyName: host.company_name || null,
  });

  return sendEmail({
    to: guestEmail,
    subject: `Reschedule Confirmed: ${eventType.title}`,
    html: rescheduleHtml,
    replyTo: host.email,
  });
}

/**
 * Send cancellation confirmation to guest
 */
export async function sendCancellationConfirmation(
  booking: Booking,
  eventType: EventType,
  guestEmail: string,
  guestName: string,
  host: UserProfile
) {
  const cancellationHtml = generateCancellationEmail({
    guestName,
    eventTitle: eventType.title,
    startTime: booking.start_time,
    endTime: booking.end_time,
    timezone: booking.guest_time_zone,
    hostName: host.full_name || 'Your host',
    supportEmail: SUPPORT_EMAIL,
    companyName: host.company_name || null,
  });

  return sendEmail({
    to: guestEmail,
    subject: `Booking Cancelled: ${eventType.title}`,
    html: cancellationHtml,
    replyTo: host.email,
  });
}

/**
 * Send cancellation notification to host
 */
export async function sendCancellationNotificationToHost(
  booking: Booking,
  eventType: EventType,
  guestName: string,
  guestEmail: string,
  host: UserProfile
) {
  const notificationHtml = generateHostCancellationEmail({
    hostName: host.full_name || 'there',
    guestName,
    guestEmail,
    eventTitle: eventType.title,
    startTime: booking.start_time,
    timezone: booking.guest_time_zone,
    companyName: host.company_name || null,
  });

  return sendEmail({
    to: host.email,
    subject: `Booking Cancelled: ${eventType.title}`,
    html: notificationHtml,
  });
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(
  booking: Booking,
  eventType: EventType,
  recipientEmail: string,
  recipientName: string,
  hoursUntil: number,
  host: UserProfile // Add host parameter
) {
  const reminderHtml = generateReminderEmail({
    recipientName,
    eventTitle: eventType.title,
    startTime: booking.start_time,
    timezone: booking.guest_time_zone,
    hoursUntil,
    location: eventType.location_value || 'To be confirmed',
    isPaid: eventType.is_paid || false,
    paymentLink: eventType.payment_link || undefined,
    paymentInstructions: eventType.payment_instructions || undefined,
    companyName: host.company_name || null, // Use host.company_name
  });

  return sendEmail({
    to: recipientEmail,
    subject: `Reminder: ${eventType.title} in ${hoursUntil} hours`,
    html: reminderHtml,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string
) {
  const resetHtml = generatePasswordResetEmail({
    userName,
    resetUrl,
    appName: APP_NAME,
  });

  return sendEmail({
    to: userEmail,
    subject: `Reset Your ${APP_NAME} Password`,
    html: resetHtml,
  });
}

/**
 * Send contact form notification to superadmin
 */
export async function sendContactFormToSuperadmin({ name, email, subject, message }: { name: string; email: string; subject: string; message: string }) {
  const superadminEmail = import.meta.env.VITE_SUPERADMIN_EMAIL || SUPPORT_EMAIL;
  const html = emailWrapper(`
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `);
  return sendEmail({
    to: superadminEmail,
    subject: `[Contact Form] ${subject}`,
    html,
    replyTo: email,
  });
}

/**
 * Notify superadmin of user events (signup, upgrade, downgrade, cancel, etc)
 */
export async function notifySuperadminUserEvent({
  type,
  user,
  details = {},
}: {
  type: 'signup' | 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'delete' | 'other';
  user: { id: string; email: string; full_name?: string; plan?: string; status?: string };
  details?: Record<string, any>;
}) {
  const superadminEmail = import.meta.env.VITE_SUPERADMIN_EMAIL || SUPPORT_EMAIL;
  let subject = '';
  let html = '';
  switch (type) {
    case 'signup':
      subject = `[New Signup] ${user.email}`;
      html = emailWrapper(`
        <h2>New User Signup</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Plan:</strong> ${user.plan || 'free'}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
      `);
      break;
    case 'upgrade':
      subject = `[Upgrade] ${user.email}`;
      html = emailWrapper(`
        <h2>User Upgraded Subscription</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>New Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
      break;
    case 'downgrade':
      subject = `[Downgrade] ${user.email}`;
      html = emailWrapper(`
        <h2>User Downgraded Subscription</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>New Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
      break;
    case 'cancel':
      subject = `[Cancel Subscription] ${user.email}`;
      html = emailWrapper(`
        <h2>User Cancelled Subscription</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
      break;
    case 'reactivate':
      subject = `[Reactivate Subscription] ${user.email}`;
      html = emailWrapper(`
        <h2>User Reactivated Subscription</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
      break;
    case 'delete':
      subject = `[Account Deleted] ${user.email}`;
      html = emailWrapper(`
        <h2>User Deleted Account</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
      break;
    default:
      subject = `[User Event] ${user.email}`;
      html = emailWrapper(`
        <h2>User Event: ${type}</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Name:</strong> ${user.full_name || ''}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Plan:</strong> ${user.plan}</p>
        <p><strong>Status:</strong> ${user.status || ''}</p>
        <p><strong>Details:</strong> ${JSON.stringify(details)}</p>
      `);
  }
  return sendEmail({
    to: superadminEmail,
    subject,
    html,
  });
}

/**
 * Generic email sender using Brevo API
 * In development without API key, logs the email
 * In production with API key, sends via Brevo
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; isDev?: boolean; data?: { id: string }; error?: unknown }> {
  try {
    // In development without API key, log the email
    if (!BREVO_API_KEY) {
      console.log('📧 [DEV MODE] Email would be sent via Brevo:', {
        to: options.to,
        subject: options.subject,
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      });
      return { success: true, isDev: true };
    }

    // Prepare Brevo API payload
    const payload = {
      sender: {
        name: EMAIL_FROM_NAME,
        email: EMAIL_FROM,
      },
      to: [
        {
          email: options.to,
          name: options.toName || options.to.split('@')[0],
        },
      ],
      subject: options.subject,
      htmlContent: options.html,
      ...(options.replyTo && {
        replyTo: {
          email: options.replyTo,
        },
      }),
    };

    // Send via Brevo API
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Brevo API Error:', response.status, errorData);
      return { 
        success: false, 
        error: errorData.message || `Brevo API error: ${response.status}` 
      };
    }

    const data = await response.json();
    console.log('✅ Email sent via Brevo:', {
      to: options.to,
      subject: options.subject,
      messageId: data.messageId,
    });

    return { success: true, data: { id: data.messageId } };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error };
  }
}

// ==================== EMAIL TEMPLATE GENERATORS ====================

interface BookingConfirmationData {
  guestName: string;
  eventTitle: string;
  eventDescription?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string;
  cancelUrl: string;
  rescheduleUrl: string;
  hostName: string;
  isPaid?: boolean;
  paymentLink?: string;
  paymentInstructions?: string;
}

function formatHostNameWithCompany(hostName: string, companyName?: string | null): string {
  return companyName ? `${hostName} (${companyName})` : hostName;
}

function generateBookingConfirmationEmail(data: BookingConfirmationData & { companyName?: string | null }): string {
  const formattedStart = formatDateTime(data.startTime, data.timezone);
  const formattedEnd = formatTime(data.endTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header">
        <h1>✅ Your booking is confirmed!</h1>
        <p>We've received your booking with ${formatHostNameWithCompany(data.hostName, data.companyName)}</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${data.guestName},</p>
        <p>Thank you for scheduling a meeting. Here are your booking details:</p>
        
        <div class="info-box">
          <h2 style="margin-top: 0;">${data.eventTitle}</h2>
          <p><strong>📅 Date & Time:</strong><br>${formattedStart} – ${formattedEnd}</p>
          <p><strong>🌍 Timezone:</strong> ${data.timezone}</p>
          <p><strong>📍 Location:</strong> ${data.location}</p>
          ${data.eventDescription ? `<p><strong>📝 Description:</strong><br>${data.eventDescription}</p>` : ''}
        </div>
        
        ${data.isPaid ? `
          <div class="info-box success-box">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #15803d;">💳 Payment Required</p>
            ${data.paymentLink ? `
              <div style="background: #ffffff; padding: 12px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #15803d;">Payment Details:</p>
                <pre style="margin: 0; color: #166534; font-size: 13px; white-space: pre-wrap; word-break: break-all; font-family: monospace;">${data.paymentLink}</pre>
              </div>
            ` : ''}
            <p style="margin: 0; color: #166534; font-size: 14px;">
              ${data.paymentInstructions || 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt.'}
            </p>
            ${data.paymentLink && data.paymentLink.startsWith('http') ? `
              <p style="margin: 12px 0 0 0;"><a href="${data.paymentLink}" class="button button-success">Complete Payment</a></p>
            ` : ''}
          </div>
        ` : ''}
        
        <h2>Need to make changes?</h2>
        <p>
          <a href="${data.rescheduleUrl}" class="button">Reschedule</a>
          <a href="${data.cancelUrl}" class="button button-secondary">Cancel</a>
        </p>
        
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br><strong>${formatHostNameWithCompany(data.hostName, data.companyName)}</strong></p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p><a href="${APP_URL}">${APP_NAME}</a></p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#3b82f6');
}

interface HostNotificationData {
  hostName: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  timezone: string;
  dashboardUrl: string;
}

function generateHostNotificationEmail(data: HostNotificationData & { companyName?: string | null }): string {
  const formattedStart = formatDateTime(data.startTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header" style="border-bottom-color: #10b981;">
        <h1>🎉 New Booking!</h1>
        <p>You have a new booking for ${data.eventTitle}</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${formatHostNameWithCompany(data.hostName, data.companyName)},</p>
        <p><strong>${data.guestName}</strong> has booked your <strong>${data.eventTitle}</strong> event.</p>
        
        <div class="info-box success-box">
          <p><strong>👤 Guest:</strong> ${data.guestName}</p>
          <p><strong>📧 Email:</strong> <a href="mailto:${data.guestEmail}">${data.guestEmail}</a></p>
          <p style="margin-bottom: 0;"><strong>📅 Time:</strong> ${formattedStart}</p>
        </div>
        
        <p><a href="${data.dashboardUrl}" class="button" style="background: #10b981;">View in Dashboard</a></p>
        
        <p>Check your dashboard for more details and to manage your bookings.</p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#10b981');
}

interface RescheduleData {
  guestName: string;
  eventTitle: string;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime: string;
  newEndTime: string;
  timezone: string;
  location: string;
  cancelUrl: string;
  hostName: string;
}

function generateRescheduleEmail(data: RescheduleData & { companyName?: string | null }): string {
  const oldStart = formatShortDate(data.oldStartTime, data.timezone);
  const newStart = formatDateTime(data.newStartTime, data.timezone);
  const newEnd = formatTime(data.newEndTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header" style="border-bottom-color: #f59e0b;">
        <h1>✏️ Booking Rescheduled</h1>
        <p>Your ${data.eventTitle} appointment has been updated</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${data.guestName},</p>
        <p>Your booking with <strong>${formatHostNameWithCompany(data.hostName, data.companyName)}</strong> has been successfully rescheduled:</p>
        
        <!-- Time comparison - stacks on mobile -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
          <tr>
            <td style="padding: 0 8px 16px 0; vertical-align: top;" width="50%">
              <div class="info-box error-box" style="margin: 0; height: 100%;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">❌ Previous Time</p>
                <p style="margin: 0; color: #7f1d1d;"><s>${oldStart}</s></p>
              </div>
            </td>
            <td style="padding: 0 0 16px 8px; vertical-align: top;" width="50%">
              <div class="info-box success-box" style="margin: 0; height: 100%;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534;">✅ New Time</p>
                <p style="margin: 0; color: #15803d;"><strong>${newStart}</strong></p>
                <p style="margin: 4px 0 0 0; color: #047857;">– ${newEnd}</p>
              </div>
            </td>
          </tr>
        </table>
        
        <div class="info-box">
          <p><strong>📍 Location:</strong> ${data.location}</p>
          <p style="margin-bottom: 0;"><strong>🌍 Timezone:</strong> ${data.timezone}</p>
        </div>
        
        <p>If this doesn't work for you, you can cancel the booking:</p>
        <p><a href="${data.cancelUrl}" class="button button-danger">Cancel Booking</a></p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#f59e0b');
}

interface CancellationData {
  guestName: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  timezone: string;
  hostName: string;
  supportEmail: string;
}

function generateCancellationEmail(data: CancellationData & { companyName?: string | null }): string {
  const formattedStart = formatDateTime(data.startTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header" style="border-bottom-color: #ef4444;">
        <h1>❌ Booking Cancelled</h1>
        <p>Your booking has been cancelled</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${data.guestName},</p>
        <p>Your booking with <strong>${formatHostNameWithCompany(data.hostName, data.companyName)}</strong> has been cancelled.</p>
        
        <div class="info-box error-box">
          <p><strong>Event:</strong> ${data.eventTitle}</p>
          <p style="margin-bottom: 0;"><strong>Original Time:</strong> ${formattedStart}</p>
        </div>
        
        <p>If you'd like to reschedule or have questions, please contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#ef4444');
}

interface HostCancellationData {
  hostName: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startTime: string;
  timezone: string;
}

function generateHostCancellationEmail(data: HostCancellationData & { companyName?: string | null }): string {
  const formattedStart = formatDateTime(data.startTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header" style="border-bottom-color: #ef4444;">
        <h1>❌ Booking Cancelled</h1>
        <p>A guest has cancelled their booking</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${formatHostNameWithCompany(data.hostName, data.companyName)},</p>
        <p><strong>${data.guestName}</strong> has cancelled their booking.</p>
        
        <div class="info-box error-box">
          <p><strong>Event:</strong> ${data.eventTitle}</p>
          <p><strong>Guest:</strong> ${data.guestName} (<a href="mailto:${data.guestEmail}">${data.guestEmail}</a>)</p>
          <p style="margin-bottom: 0;"><strong>Time:</strong> ${formattedStart}</p>
        </div>
        
        <p>This time slot is now available for other bookings.</p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#ef4444');
}

interface ReminderData {
  recipientName: string;
  eventTitle: string;
  startTime: string;
  timezone: string;
  hoursUntil: number;
  location: string;
  isPaid?: boolean;
  paymentLink?: string;
  paymentInstructions?: string;
}

function generateReminderEmail(data: ReminderData & { companyName?: string | null }): string {
  const formattedStart = formatDateTime(data.startTime, data.timezone);

  const content = `
    <tr>
      <td class="email-header" style="border-bottom-color: #8b5cf6;">
        <h1>⏰ Appointment Reminder</h1>
        <p>Your meeting is coming up in ${data.hoursUntil} hour${data.hoursUntil !== 1 ? 's' : ''}</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${data.recipientName},</p>
        <p>This is a friendly reminder about your upcoming appointment with <strong>${formatHostNameWithCompany(data.recipientName, data.companyName)}</strong>:</p>
        
        <div class="info-box" style="border-left-color: #8b5cf6; background: #faf5ff;">
          <p><strong>📅 Event:</strong> ${data.eventTitle}</p>
          <p><strong>🕐 Date & Time:</strong> ${formattedStart}</p>
          <p><strong>📍 Location:</strong> ${data.location}</p>
          <p style="margin-bottom: 0;"><strong>🌍 Timezone:</strong> ${data.timezone}</p>
        </div>
        
        ${data.isPaid ? `
          <div class="info-box success-box">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #15803d;">💳 Payment Reminder</p>
            ${data.paymentLink ? `
              <div style="background: #ffffff; padding: 12px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #15803d;">Payment Details:</p>
                <pre style="margin: 0; color: #166534; font-size: 13px; white-space: pre-wrap; word-break: break-all; font-family: monospace;">${data.paymentLink}</pre>
              </div>
            ` : ''}
            <p style="margin: 0; color: #166534; font-size: 14px;">
              ${data.paymentInstructions || 'Please ensure payment is completed before your appointment.'}
            </p>
            ${data.paymentLink && data.paymentLink.startsWith('http') ? `
              <p style="margin: 12px 0 0 0;"><a href="${data.paymentLink}" class="button button-success">Complete Payment</a></p>
            ` : ''}
          </div>
        ` : ''}
        
        <p>Please make sure you're ready for the appointment. If you need to cancel or reschedule, please do so as soon as possible.</p>
        <p>See you soon!</p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#8b5cf6');
}

interface PasswordResetData {
  userName: string;
  resetUrl: string;
  appName: string;
}

function generatePasswordResetEmail(data: PasswordResetData): string {
  const content = `
    <tr>
      <td class="email-header">
        <h1>🔐 Reset Your Password</h1>
        <p>Password reset request for ${data.appName}</p>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        <p>Hi ${data.userName},</p>
        <p>We received a request to reset the password for your ${data.appName} account. Click the button below to create a new password:</p>
        
        <p style="text-align: center; margin: 24px 0;">
          <a href="${data.resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>This link will expire in <strong>24 hours</strong> for security reasons.</p>
        
        <div class="info-box warning-box">
          <p style="margin: 0;"><strong>⚠️ Didn't request this?</strong><br>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">For security reasons, never share your password reset link with anyone.</p>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>© ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
      </td>
    </tr>
  `;

  return emailWrapper(content, '#3b82f6');
}
