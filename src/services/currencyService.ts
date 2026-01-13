/**
 * Currency Settings Service
 * 
 * This service handles currency preference management for users.
 */

import { supabase } from '../lib/supabase';

export interface CurrencySettings {
  currency: string;
}

/**
 * Get user's currency settings
 */
export async function getCurrencySettings(userId: string): Promise<CurrencySettings | null> {
  const { data, error } = await supabase
    .from('users_profile')
    .select('currency')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching currency settings:', error);
    return null;
  }

  return data as CurrencySettings;
}

/**
 * Update currency preference
 */
export async function updateCurrency(
  userId: string,
  currency: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ currency })
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
