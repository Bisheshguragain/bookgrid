/**
 * Contacts Page
 * ==============
 * Manage user contacts for quick booking selection.
 * 
 * Features:
 * - View all contacts in a list/grid
 * - Add new contact with validation
 * - Edit existing contacts
 * - Delete contacts
 * - Search contacts
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getContactCount,
  validateContact,
} from '../services/contactsService';
import type { Contact, ContactInsert } from '../lib/database.types';

// ============================================
// CONSTANTS
// ============================================
const MAX_CONTACTS = 500;

export function Contacts() {
  // ============================================
  // STATE
  // ============================================
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactCount, setContactCount] = useState(0);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<ContactInsert>({
    full_name: '',
    email: '',
    phone_number: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user } = useAuthStore();

  // ============================================
  // DATA LOADING
  // ============================================
  
  /**
   * Load all contacts for the current user
   */
  const loadContacts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [contactsData, count] = await Promise.all([
        getContacts(user.id),
        getContactCount(user.id),
      ]);
      setContacts(contactsData);
      setContactCount(count);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Search contacts by name or email
   */
  const handleSearch = useCallback(async (query: string) => {
    if (!user) return;
    
    if (query.trim() === '') {
      loadContacts();
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchContacts(user.id, query);
      setContacts(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadContacts]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // ============================================
  // FORM HANDLERS
  // ============================================
  
  /**
   * Open the add contact form
   */
  const handleAddNew = () => {
    setEditingContact(null);
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
    });
    setFormErrors([]);
    setShowForm(true);
  };

  /**
   * Open the edit form for a contact
   */
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      full_name: contact.full_name,
      email: contact.email,
      phone_number: contact.phone_number,
    });
    setFormErrors([]);
    setShowForm(true);
  };

  /**
   * Close the form and reset state
   */
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
    });
    setFormErrors([]);
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof ContactInsert, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user types
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  };

  /**
   * Submit the form (create or update)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate input
    const validation = validateContact(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingContact) {
        // Update existing contact
        const result = await updateContact(user.id, editingContact.id, formData);
        if (result.success && result.contact) {
          setContacts(prev => prev.map(c => 
            c.id === editingContact.id ? result.contact! : c
          ));
          handleCloseForm();
        } else {
          setFormErrors([result.error || 'Failed to update contact']);
        }
      } else {
        // Create new contact
        const result = await createContact(user.id, formData);
        if (result.success && result.contact) {
          setContacts(prev => [...prev, result.contact!].sort((a, b) => 
            a.full_name.localeCompare(b.full_name)
          ));
          setContactCount(prev => prev + 1);
          handleCloseForm();
        } else {
          setFormErrors([result.error || 'Failed to create contact']);
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      setFormErrors(['An unexpected error occurred']);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Delete a contact
   */
  const handleDelete = async (contactId: string) => {
    if (!user) return;

    setDeletingId(contactId);
    try {
      const result = await deleteContact(user.id, contactId);
      if (result.success) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setContactCount(prev => prev - 1);
      } else {
        alert(result.error || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('An unexpected error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Confirm deletion
   */
  const confirmDelete = (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.full_name}?`)) {
      handleDelete(contact.id);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">📇 Contacts</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Manage your contacts for quick booking
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-purple-200">
              {contactCount} / {MAX_CONTACTS} contacts
            </span>
            <button
              onClick={handleAddNew}
              disabled={contactCount >= MAX_CONTACTS}
              className="w-full sm:w-auto px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
        <div className="relative">
          <svg 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Add your first contact to quickly select them when booking meetings'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
              >
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            {/* Contact Rows */}
            {contacts.map((contact) => (
              <div 
                key={contact.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-purple-50 transition-colors"
              >
                {/* Name */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{contact.full_name}</p>
                    <p className="text-sm text-gray-500 md:hidden">{contact.email}</p>
                  </div>
                </div>
                
                {/* Email - Hidden on mobile (shown above) */}
                <div className="hidden md:flex md:col-span-4 items-center">
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-purple-600 hover:text-purple-700 hover:underline truncate"
                  >
                    {contact.email}
                  </a>
                </div>
                
                {/* Phone */}
                <div className="md:col-span-2 flex items-center">
                  <a 
                    href={`tel:${contact.phone_number}`}
                    className="text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    📱 {contact.phone_number}
                  </a>
                </div>
                
                {/* Actions */}
                <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Edit contact"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => confirmDelete(contact)}
                    disabled={deletingId === contact.id}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete contact"
                  >
                    {deletingId === contact.id ? (
                      <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingContact ? '✏️ Edit Contact' : '➕ Add New Contact'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error Messages */}
              {formErrors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">2-100 characters</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Include country code for international numbers</p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingContact ? 'Update Contact' : 'Add Contact'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
