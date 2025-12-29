import { parseISO, addMinutes, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import type { AvailabilityRule, Booking } from '../lib/database.types';

export function formatDateTime(
  dateTime: string | Date, 
  timeZone: string = 'America/New_York',
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return formatInTimeZone(date, timeZone, formatStr);
}

export function formatTime(
  time: string, 
  timeZone: string = 'America/New_York'
): string {
  // Parse time string (HH:mm) and format it for display
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return formatInTimeZone(date, timeZone, 'h:mm a');
}

export function convertTimeZone(
  dateTime: string | Date,
  fromTimeZone: string,
  toTimeZone: string
): Date {
  const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  const zonedTime = utcToZonedTime(date, fromTimeZone);
  return zonedTimeToUtc(zonedTime, toTimeZone);
}

export function generateTimeSlots(
  date: Date,
  availabilityRules: AvailabilityRule[],
  existingBookings: Booking[],
  duration: number,
  bufferTime: number = 0,
  timeZone: string = 'America/New_York'
): string[] {
  const dayOfWeek = date.getDay();
  const slots: string[] = [];
  
  // Find availability rules for this day
  const rules = availabilityRules.filter(rule => rule.day_of_week === dayOfWeek);
  
  if (rules.length === 0) return slots;
  
  // Get existing bookings for this date
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dayBookings = existingBookings.filter(booking => {
    const bookingDate = parseISO(booking.start_time);
    return isSameDay(bookingDate, date) && booking.status === 'confirmed';
  });
  
  rules.forEach(rule => {
    const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
    const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
    
    const ruleStart = new Date(date);
    ruleStart.setHours(startHours, startMinutes, 0, 0);
    
    const ruleEnd = new Date(date);
    ruleEnd.setHours(endHours, endMinutes, 0, 0);
    
    let currentSlot = new Date(ruleStart);
    
    while (currentSlot < ruleEnd) {
      const slotEnd = addMinutes(currentSlot, duration);
      
      // Check if slot end time doesn't exceed rule end time
      if (slotEnd > ruleEnd) break;
      
      // Check for conflicts with existing bookings
      const hasConflict = dayBookings.some(booking => {
        const bookingStart = parseISO(booking.start_time);
        const bookingEnd = parseISO(booking.end_time);
        const slotStartWithBuffer = addMinutes(currentSlot, -bufferTime);
        const slotEndWithBuffer = addMinutes(slotEnd, bufferTime);
        
        return (
          (slotStartWithBuffer < bookingEnd && slotEndWithBuffer > bookingStart)
        );
      });
      
      if (!hasConflict) {
        slots.push(formatInTimeZone(currentSlot, timeZone, "yyyy-MM-dd'T'HH:mm:ss"));
      }
      
      // Move to next 30-minute slot
      currentSlot = addMinutes(currentSlot, 30);
    }
  });
  
  return slots.sort();
}

export function isTimeSlotAvailable(
  dateTime: string,
  duration: number,
  availabilityRules: AvailabilityRule[],
  existingBookings: Booking[],
  bufferTime: number = 0
): boolean {
  const slotStart = parseISO(dateTime);
  const slotEnd = addMinutes(slotStart, duration);
  const dayOfWeek = slotStart.getDay();
  
  // Check if there's an availability rule for this day and time
  const hasAvailabilityRule = availabilityRules.some(rule => {
    if (rule.day_of_week !== dayOfWeek) return false;
    
    const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
    const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
    
    const ruleStart = new Date(slotStart);
    ruleStart.setHours(startHours, startMinutes, 0, 0);
    
    const ruleEnd = new Date(slotStart);
    ruleEnd.setHours(endHours, endMinutes, 0, 0);
    
    return slotStart >= ruleStart && slotEnd <= ruleEnd;
  });
  
  if (!hasAvailabilityRule) return false;
  
  // Check for conflicts with existing bookings
  const hasConflict = existingBookings.some(booking => {
    if (booking.status !== 'confirmed') return false;
    
    const bookingStart = parseISO(booking.start_time);
    const bookingEnd = parseISO(booking.end_time);
    const slotStartWithBuffer = addMinutes(slotStart, -bufferTime);
    const slotEndWithBuffer = addMinutes(slotEnd, bufferTime);
    
    return (
      (slotStartWithBuffer < bookingEnd && slotEndWithBuffer > bookingStart)
    );
  });
  
  return !hasConflict;
}

export function getTimeZones(): { value: string; label: string }[] {
  return [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Mumbai', label: 'Mumbai (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  ];
}

export function getDayOfWeekName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateBookingUrl(eventTypeId: string, username?: string): string {
  if (username) {
    return `${window.location.origin}/u/${username}`;
  }
  return `${window.location.origin}/book/${eventTypeId}`;
}

export function generateEmbedCode(eventTypeId: string, width = '100%', height = '600px'): string {
  const bookingUrl = generateBookingUrl(eventTypeId);
  return `<iframe src="${bookingUrl}" width="${width}" height="${height}" frameborder="0"></iframe>`;
}
