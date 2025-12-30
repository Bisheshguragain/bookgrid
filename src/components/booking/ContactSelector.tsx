/**
 * ContactSelector Component
 * ==========================
 * A reusable component for selecting a saved contact when booking.
 * 
 * Features:
 * - Search/filter contacts
 * - Display contacts in a dropdown
 * - Auto-fill form fields when contact is selected
 * - Clear selection option
 * 
 * Security:
 * - Only displays contacts owned by the authenticated user
 * - No sensitive data exposed
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getContacts, searchContacts } from '../../services/contactsService';
import { useAuthStore } from '../../store/authStore';
import type { Contact } from '../../lib/database.types';

// ============================================
// TYPES
// ============================================
interface ContactSelectorProps {
  /** Callback when a contact is selected */
  onSelect: (contact: Contact | null) => void;
  /** Currently selected contact */
  selectedContact?: Contact | null;
  /** Optional CSS class name */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
}

// ============================================
// DEBOUNCE HOOK
// ============================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ContactSelector({
  onSelect,
  selectedContact = null,
  className = '',
  placeholder = 'Search contacts...',
}: ContactSelectorProps) {
  // ============================================
  // STATE
  // ============================================
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ============================================
  // DATA LOADING
  // ============================================

  /**
   * Load contacts based on search query
   * Uses debounced search to prevent excessive API calls
   */
  const loadContacts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let result: Contact[];
      
      if (debouncedSearch.trim()) {
        // Search contacts if query provided
        result = await searchContacts(user.id, debouncedSearch.trim());
      } else {
        // Load all contacts
        result = await getContacts(user.id);
      }

      setContacts(result);
    } catch (err) {
      setError('Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, debouncedSearch]);

  // Load contacts when dropdown opens or search changes
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, loadContacts]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle contact selection
   */
  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    setIsOpen(false);
    setSearchQuery('');
  };

  /**
   * Clear the selected contact
   */
  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  /**
   * Handle input focus - open dropdown
   */
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // ============================================
  // RENDER
  // ============================================

  // If user is not authenticated, don't show the selector
  if (!user?.id) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Contact Display */}
      {selectedContact ? (
        <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center gap-3">
            {/* Contact Avatar */}
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {selectedContact.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Contact Info */}
            <div>
              <p className="font-medium text-gray-900">{selectedContact.full_name}</p>
              <p className="text-sm text-gray-600">{selectedContact.email}</p>
            </div>
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear contact selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Loading Spinner */}
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {error ? (
                <div className="p-3 text-sm text-red-600">{error}</div>
              ) : contacts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">
                  {loading ? 'Loading...' : 'No contacts found'}
                </div>
              ) : (
                <ul className="py-1">
                  {contacts.map((contact) => (
                    <li key={contact.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(contact)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        {/* Contact Avatar */}
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-medium text-xs">
                            {contact.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Contact Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {contact.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                            {contact.phone_number && ` • ${contact.phone_number}`}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
