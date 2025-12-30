/**
 * Contacts Service
 * =================
 * Centralized service for managing user contacts.
 * All operations are protected by Row Level Security (RLS) in the database.
 * 
 * Security Features:
 * - RLS ensures users can only access their own contacts
 * - Input validation on both frontend and backend (database constraints)
 * - Sanitization of inputs (handled by database trigger)
 * - Rate limiting (max 500 contacts per user)
 */

import { supabase } from '../lib/supabase';
import type { Contact, ContactInsert, ContactUpdate } from '../lib/database.types';

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Email validation regex
 * Matches standard email format: user@domain.tld
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Phone number validation regex
 * Flexible format: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

/**
 * Validate contact input before sending to database
 * Returns { valid: boolean, errors: string[] }
 */
export const validateContact = (contact: ContactInsert): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate full name
  const trimmedName = contact.full_name?.trim() || '';
  if (trimmedName.length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  if (trimmedName.length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  // Validate email
  const trimmedEmail = contact.email?.trim().toLowerCase() || '';
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }

  // Validate phone number
  const trimmedPhone = contact.phone_number?.trim() || '';
  if (!PHONE_REGEX.test(trimmedPhone)) {
    errors.push('Please enter a valid phone number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize contact input
 * Trims whitespace and normalizes email to lowercase
 */
const sanitizeContact = <T extends ContactInsert | ContactUpdate>(contact: T): T => {
  const sanitized = { ...contact };
  
  if (sanitized.full_name) {
    sanitized.full_name = sanitized.full_name.trim();
  }
  if (sanitized.email) {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }
  if (sanitized.phone_number) {
    sanitized.phone_number = sanitized.phone_number.trim();
  }
  
  return sanitized;
};

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Fetch all contacts for the current user
 * Sorted by full_name ascending
 */
export const getContacts = async (userId: string): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching contacts:', error);
    throw new Error('Failed to load contacts');
  }

  return data || [];
};

/**
 * Fetch a single contact by ID
 * Returns null if not found or not owned by user
 */
export const getContactById = async (userId: string, contactId: string): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching contact:', error);
    throw new Error('Failed to load contact');
  }

  return data;
};

/**
 * Search contacts by name or email
 * Case-insensitive partial match
 */
export const searchContacts = async (userId: string, query: string): Promise<Contact[]> => {
  const searchTerm = `%${query.trim().toLowerCase()}%`;
  
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .order('full_name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching contacts:', error);
    throw new Error('Failed to search contacts');
  }

  return data || [];
};

/**
 * Create a new contact
 * Validates and sanitizes input before saving
 */
export const createContact = async (
  userId: string,
  contact: ContactInsert
): Promise<{ success: boolean; contact?: Contact; error?: string }> => {
  // Validate input
  const validation = validateContact(contact);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('. '),
    };
  }

  // Sanitize input
  const sanitized = sanitizeContact(contact);

  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        full_name: sanitized.full_name,
        email: sanitized.email,
        phone_number: sanitized.phone_number,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A contact with this email already exists',
        };
      }
      // Handle contact limit error
      if (error.message?.includes('Contact limit reached')) {
        return {
          success: false,
          error: 'You have reached the maximum number of contacts (500)',
        };
      }
      throw error;
    }

    return {
      success: true,
      contact: data,
    };
  } catch (err) {
    console.error('Error creating contact:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create contact',
    };
  }
};

/**
 * Update an existing contact
 * Only updates provided fields
 */
export const updateContact = async (
  userId: string,
  contactId: string,
  updates: ContactUpdate
): Promise<{ success: boolean; contact?: Contact; error?: string }> => {
  // Validate if full contact update
  if (updates.full_name && updates.email && updates.phone_number) {
    const validation = validateContact(updates as ContactInsert);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('. '),
      };
    }
  }

  // Sanitize input
  const sanitized = sanitizeContact(updates);

  try {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('user_id', userId) // Security: ensure user owns the contact
      .select()
      .single();

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A contact with this email already exists',
        };
      }
      throw error;
    }

    if (!data) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    return {
      success: true,
      contact: data,
    };
  } catch (err) {
    console.error('Error updating contact:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update contact',
    };
  }
};

/**
 * Delete a contact
 * Returns success/failure status
 */
export const deleteContact = async (
  userId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId); // Security: ensure user owns the contact

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Error deleting contact:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete contact',
    };
  }
};

/**
 * Get contact count for the current user
 * Used to show how many contacts remaining
 */
export const getContactCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting contacts:', error);
    return 0;
  }

  return count || 0;
};

// ============================================
// EXPORT SERVICE OBJECT
// ============================================
export const contactsService = {
  getContacts,
  getContactById,
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactCount,
  validateContact,
};

export default contactsService;
