-- Migration: Add payment fields to event_types table
-- Run this SQL in your Supabase SQL Editor

-- Add payment-related columns to event_types
ALTER TABLE event_types 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.';

-- Add check constraint to ensure payment_link is required if is_paid is true
ALTER TABLE event_types
ADD CONSTRAINT payment_link_required_if_paid 
CHECK (is_paid = false OR (is_paid = true AND payment_link IS NOT NULL AND length(payment_link) > 0));

COMMENT ON COLUMN event_types.is_paid IS 'Whether this event type requires payment';
COMMENT ON COLUMN event_types.payment_link IS 'Payment details - can be a payment link (PayPal, Stripe, Square, GoCardless) OR bank account details for direct transfer';
COMMENT ON COLUMN event_types.payment_instructions IS 'Instructions shown to attendees about payment requirements and how to confirm payment';
