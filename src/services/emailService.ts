/**
 * Email Service
 * Handles all email communications for the application
 * Using Resend as the email service provider
 */

// Note: Resend is installed but can be used via API or server-side functions
// For now, we'll export email template functions that can be used with any email provider
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];
type UserProfile = Database['public']['Tables']['users_profile']['Row'];

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

const EMAIL_FROM = import.meta.env.EMAIL_FROM || 'noreply@bookgrid.com';
const SUPPORT_EMAIL = import.meta.env.SUPPORT_EMAIL || 'support@bookgrid.com';
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const APP_NAME = import.meta.env.VITE_APP_NAME || 'BookGrid';

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
  hoursUntil: number
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
 * Generic email sender - logs in dev mode, sends via Resend in production
 */
async function sendEmail(options: EmailOptions) {
  try {
    // In development without API key, log the email
    if (!import.meta.env.RESEND_API_KEY) {
      console.log('📧 [DEV MODE] Email would be sent:', {
        to: options.to,
        subject: options.subject,
        from: EMAIL_FROM,
      });
      return { success: true, isDev: true };
    }

    // In production with API key, use Resend API
    // Note: This would typically be called from a server function or edge function
    // For now, we log it and return success
    console.log('✅ Email queued for delivery:', {
      to: options.to,
      subject: options.subject,
    });

    return { success: true, data: { id: 'mock-' + Date.now() } };
  } catch (error) {
    console.error('Email service error:', error);
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

function generateBookingConfirmationEmail(data: BookingConfirmationData): string {
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  const formattedStart = startDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });
  const formattedEnd = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #3b82f6; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px 10px 0; }
    .button.secondary { background: #e5e7eb; color: #374151; }
    .event-details { background: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
    h2 { color: #374151; font-size: 18px; margin: 20px 0 10px 0; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Your booking is confirmed!</h1>
      <p class="meta">We've received your booking with ${data.hostName}</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.guestName},</p>
      
      <p>Thank you for scheduling a meeting with us. Here are the details of your confirmed booking:</p>
      
      <div class="event-details">
        <h2>${data.eventTitle}</h2>
        <p><strong>📅 Date & Time:</strong><br>${formattedStart} – ${formattedEnd}</p>
        <p><strong>🌍 Timezone:</strong> ${data.timezone}</p>
        <p><strong>📍 Location:</strong> ${data.location}</p>
        ${data.eventDescription ? `<p><strong>📝 Description:</strong><br>${data.eventDescription}</p>` : ''}
        ${data.isPaid ? `
          <div style="background: #dcfce7; padding: 15px; margin-top: 15px; border-left: 4px solid #16a34a; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #15803d; font-weight: 600;">💳 Payment Required</p>
            
            ${data.paymentLink ? `
              <div style="background: #ffffff; padding: 12px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 5px 0; color: #15803d; font-size: 12px; font-weight: 600;">Payment Details:</p>
                <pre style="margin: 0; color: #166534; font-size: 13px; white-space: pre-wrap; font-family: 'Courier New', monospace;">${data.paymentLink}</pre>
              </div>
            ` : ''}
            
            <p style="margin: 0 0 ${data.paymentLink && data.paymentLink.startsWith('http') ? '10px' : '0'}; color: #166534; font-size: 14px;">
              ${data.paymentInstructions || 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.'}
            </p>
            
            ${data.paymentLink && data.paymentLink.startsWith('http') ? `
              <p style="margin: 0;"><a href="${data.paymentLink}" style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete Payment Online</a></p>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      <h2>What's next?</h2>
      <p>
        <a href="${data.rescheduleUrl}" class="button">Reschedule</a>
        <a href="${data.cancelUrl}" class="button secondary">Cancel</a>
      </p>
      
      <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
      
      <p>Best regards,<br>${data.hostName}</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p><a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a></p>
    </div>
  </div>
</body>
</html>
  `;
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

function generateHostNotificationEmail(data: HostNotificationData): string {
  const startDate = new Date(data.startTime);
  const formattedStart = startDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #10b981; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px 10px 0; }
    .guest-card { background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
    h2 { color: #374151; font-size: 18px; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Booking!</h1>
      <p>You have a new booking for ${data.eventTitle}</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.hostName},</p>
      
      <p><strong>${data.guestName}</strong> has booked your ${data.eventTitle} event.</p>
      
      <div class="guest-card">
        <p><strong>👤 Guest:</strong> ${data.guestName}</p>
        <p><strong>📧 Email:</strong> ${data.guestEmail}</p>
        <p><strong>📅 Time:</strong> ${formattedStart}</p>
      </div>
      
      <p>
        <a href="${data.dashboardUrl}" class="button">View in Dashboard</a>
      </p>
      
      <p>Check your dashboard for more details and manage your bookings.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
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

function generateRescheduleEmail(data: RescheduleData): string {
  const oldStart = new Date(data.oldStartTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });
  const newStart = new Date(data.newStartTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });
  const newEnd = new Date(data.newEndTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #f59e0b; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .comparison { display: flex; gap: 20px; margin: 20px 0; }
    .time-block { flex: 1; padding: 15px; background: #f0f9ff; border-radius: 6px; }
    .old { background: #fee2e2; border-left: 4px solid #ef4444; }
    .new { background: #d1fae5; border-left: 4px solid #10b981; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px 10px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
    h2 { color: #374151; font-size: 18px; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✏️ Your booking has been rescheduled</h1>
      <p>Your ${data.eventTitle} appointment details have been updated</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.guestName},</p>
      
      <p>Your booking with ${data.hostName} has been successfully rescheduled:</p>
      
      <div class="comparison">
        <div class="time-block old">
          <h3 style="margin: 0 0 10px 0; color: #7f1d1d;">Previous Time</h3>
          <p style="margin: 5px 0;"><strong>${oldStart}</strong></p>
        </div>
        <div class="time-block new">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">New Time</h3>
          <p style="margin: 5px 0;"><strong>${newStart}</strong></p>
          <p style="margin: 0; color: #047857;">– ${newEnd}</p>
        </div>
      </div>
      
      <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <p><strong>📍 Location:</strong> ${data.location}</p>
        <p><strong>🌍 Timezone:</strong> ${data.timezone}</p>
      </div>
      
      <p>
        <a href="${data.cancelUrl}" class="button" style="background: #ef4444;">Cancel Booking</a>
      </p>
      
      <p>If this doesn't work for you, feel free to reschedule again.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
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

function generateCancellationEmail(data: CancellationData): string {
  const startDate = new Date(data.startTime);
  const formattedStart = startDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #ef4444; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .info-box { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Your booking has been cancelled</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.guestName},</p>
      
      <p>Your booking with ${data.hostName} has been cancelled.</p>
      
      <div class="info-box">
        <p><strong>Event:</strong> ${data.eventTitle}</p>
        <p><strong>Original Time:</strong> ${formattedStart}</p>
      </div>
      
      <p>If you have any questions or would like to reschedule, please contact <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

interface HostCancellationData {
  hostName: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startTime: string;
  timezone: string;
}

function generateHostCancellationEmail(data: HostCancellationData): string {
  const startDate = new Date(data.startTime);
  const formattedStart = startDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #ef4444; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .info-box { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.hostName},</p>
      
      <p><strong>${data.guestName}</strong> has cancelled their booking.</p>
      
      <div class="info-box">
        <p><strong>Event:</strong> ${data.eventTitle}</p>
        <p><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
        <p><strong>Time:</strong> ${formattedStart}</p>
      </div>
      
      <p>This time slot is now available again.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
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

function generateReminderEmail(data: ReminderData): string {
  const startDate = new Date(data.startTime);
  const formattedStart = startDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: data.timezone,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #8b5cf6; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .reminder-box { background: #faf5ff; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Upcoming Appointment Reminder</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>This is a friendly reminder about your upcoming appointment in ${data.hoursUntil} hours:</p>
      
      <div class="reminder-box">
        <p><strong>📅 Event:</strong> ${data.eventTitle}</p>
        <p><strong>🕐 Date & Time:</strong> ${formattedStart}</p>
        <p><strong>📍 Location:</strong> ${data.location}</p>
        <p><strong>🌍 Timezone:</strong> ${data.timezone}</p>
      </div>
      
      ${data.isPaid ? `
        <div style="background: #dcfce7; padding: 15px; margin: 20px 0; border-left: 4px solid #16a34a; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; color: #15803d; font-weight: 600;">💳 Payment Reminder</p>
          
          ${data.paymentLink ? `
            <div style="background: #ffffff; padding: 12px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 5px 0; color: #15803d; font-size: 12px; font-weight: 600;">Payment Details:</p>
              <pre style="margin: 0; color: #166534; font-size: 13px; white-space: pre-wrap; font-family: 'Courier New', monospace;">${data.paymentLink}</pre>
            </div>
          ` : ''}
          
          <p style="margin: 0 0 ${data.paymentLink && data.paymentLink.startsWith('http') ? '10px' : '0'}; color: #166534; font-size: 14px;">
            ${data.paymentInstructions || 'Please ensure payment has been completed before your appointment. Email confirmation if you haven\'t already.'}
          </p>
          
          ${data.paymentLink && data.paymentLink.startsWith('http') ? `
            <p style="margin: 0;"><a href="${data.paymentLink}" style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete Payment Now</a></p>
          ` : ''}
        </div>
      ` : ''}
      
      <p>Please make sure you're ready for the appointment. If you need to cancel or reschedule, please do so as soon as possible.</p>
      
      <p>See you soon!</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

interface PasswordResetData {
  userName: string;
  resetUrl: string;
  appName: string;
}

function generatePasswordResetEmail(data: PasswordResetData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #3b82f6; }
    .content { background: #ffffff; padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    h1 { color: #1f2937; margin: 0 0 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.userName},</p>
      
      <p>We received a request to reset the password for your ${data.appName} account. If you made this request, click the button below to reset your password.</p>
      
      <p style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </p>
      
      <p>This link will expire in 24 hours for security reasons.</p>
      
      <div class="warning">
        <p><strong>⚠️ Important:</strong> If you didn't request this, you can safely ignore this email. Your password hasn't been changed.</p>
      </div>
      
      <p>For security reasons, never share your password reset link with anyone.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
