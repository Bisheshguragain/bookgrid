import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  metadata?: Json | null;
  created_at: string;
  updated_at?: string | null;
}

export async function createContactSubmission({ name, email, subject, message, metadata }: { name: string; email: string; subject: string; message: string; metadata?: Json | null }) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({ name, email, subject, message, status: 'new', metadata })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact submission:', error);
    throw error;
  }

  return data as ContactSubmission;
}

export async function getContactSubmissions(limit = 50, page = 1) {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching contact submissions:', error);
    throw error;
  }

  return (data || []) as ContactSubmission[];
}

export async function updateContactSubmissionStatus(id: string, status: 'new' | 'read' | 'archived') {
  const { data, error } = await supabase
    .from('contact_submissions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact submission status:', error);
    throw error;
  }

  return data as ContactSubmission;
}

export default {
  createContactSubmission,
  getContactSubmissions,
  updateContactSubmissionStatus,
};
