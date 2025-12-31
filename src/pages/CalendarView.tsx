import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, isBefore } from 'date-fns';
import type { BookingWithEventType, Contact, UserProfile } from '../lib/database.types';
import { generateAvailableSlots, type TimeSlot } from '../services/bookingService';
import { getContacts, createContact } from '../services/contactsService';
import { 
  sendBookingConfirmation, 
  sendBookingNotificationToHost,
  sendRescheduleConfirmation,
  sendCancellationConfirmation
} from '../services/emailService';
import { useLocation } from 'react-router-dom';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingWithEventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingWithEventType | null>(null);
  
  // Host profile for email sending
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);
  
  // ============================================
  // DRAG & DROP STATE
  // ============================================
  const [draggedBooking, setDraggedBooking] = useState<BookingWithEventType | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  
  // ============================================
  // QUICK BOOK STATE
  // ============================================
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookDate, setQuickBookDate] = useState<Date | null>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [quickBookForm, setQuickBookForm] = useState({
    event_type_id: '',
    prospect_name: '',
    prospect_email: '',
    prospect_phone: '',
    meeting_time: '',
    meeting_method: '', // Add meeting_method to form state
    notes: '',
  });
  const [quickBookSubmitting, setQuickBookSubmitting] = useState(false);
  const [quickBookError, setQuickBookError] = useState('');
  
  // Available time slots for selected date and event type
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Contact selection state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [saveAsContact, setSaveAsContact] = useState(true); // Save new contact to contacts list
  
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const loadBookings = async () => {
      setLoading(true);
      try {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            event_types (*)
          `)
          .eq('user_id', user.id)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true });

        if (error) throw error;
        setBookings((data || []) as BookingWithEventType[]);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user, currentDate]);

  // ============================================
  // LOAD HOST PROFILE FOR EMAIL SENDING
  // ============================================
  useEffect(() => {
    if (!user) return;
    
    const loadHostProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setHostProfile(data);
      } catch (error) {
        console.error('Error loading host profile:', error);
      }
    };

    loadHostProfile();
  }, [user]);

  // ============================================
  // LOAD EVENT TYPES FOR QUICK BOOK
  // ============================================
  useEffect(() => {
    if (!user) return;
    
    const loadEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('title', { ascending: true });

        if (error) throw error;
        setEventTypes(data || []);
      } catch (error) {
        console.error('Error loading event types:', error);
      }
    };

    loadEventTypes();
  }, [user]);

  // ============================================
  // DRAG & DROP HANDLERS
  // ============================================
  
  /**
   * Handle drag start - store the booking being dragged
   */
  const handleDragStart = useCallback((e: React.DragEvent, booking: BookingWithEventType) => {
    if (!canModifyBooking(booking)) {
      e.preventDefault();
      return;
    }
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', booking.id);
  }, []);

  /**
   * Handle drag over a date cell
   */
  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  /**
   * Handle drop on a date - move the booking
   */
  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedBooking || !user) {
      setDraggedBooking(null);
      return;
    }

    // Don't allow dropping on past dates
    if (isBefore(targetDate, new Date()) && !isToday(targetDate)) {
      alert('Cannot move booking to a past date');
      setDraggedBooking(null);
      return;
    }

    // Get the original time from the booking
    const originalStart = new Date(draggedBooking.start_time);
    const newStartTime = new Date(targetDate);
    newStartTime.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

    // Check if it's the same date
    if (isSameDay(originalStart, targetDate)) {
      setDraggedBooking(null);
      return;
    }

    // Calculate new end time
    const duration = draggedBooking.event_types.duration;
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    // Confirm the move
    const confirmMessage = `Move "${draggedBooking.guest_name}" booking from ${format(originalStart, 'MMM d')} to ${format(targetDate, 'MMM d')}?`;
    if (!window.confirm(confirmMessage)) {
      setDraggedBooking(null);
      return;
    }

    setActionLoading(draggedBooking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggedBooking.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Create updated booking object
      const updatedBooking = {
        ...draggedBooking,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString()
      };

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === draggedBooking.id 
          ? updatedBooking
          : b
      ));

      // Send reschedule notification to guest
      if (hostProfile && draggedBooking.guest_email) {
        sendRescheduleConfirmation(
          draggedBooking as any,  // old booking
          updatedBooking as any,  // new booking
          draggedBooking.event_types as any,
          draggedBooking.guest_email,
          draggedBooking.guest_name,
          hostProfile as any
        ).catch(err => console.error('Failed to send reschedule email:', err));
      }

      // Update selected date if we're viewing the source date
      if (selectedDate && isSameDay(selectedDate, originalStart)) {
        setSelectedDate(targetDate);
      }
    } catch (error) {
      console.error('Error moving booking:', error);
      alert('❌ Failed to move booking. The time slot may be taken.');
    } finally {
      setActionLoading(null);
      setDraggedBooking(null);
    }
  }, [draggedBooking, user, selectedDate, hostProfile]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setDraggedBooking(null);
    setDragOverDate(null);
  }, []);

  // ============================================
  // QUICK BOOK HANDLERS
  // ============================================
  
  /**
   * Load contacts when modal opens
   */
  useEffect(() => {
    if (!user || !showQuickBook) return;
    
    const loadContacts = async () => {
      try {
        const data = await getContacts(user.id);
        setContacts(data);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };
    
    loadContacts();
  }, [user, showQuickBook]);
  
  /**
   * Load available slots when date or event type changes
   */
  useEffect(() => {
    if (!user || !quickBookDate || !quickBookForm.event_type_id) {
      setAvailableSlots([]);
      return;
    }
    
    const loadAvailableSlots = async () => {
      setLoadingSlots(true);
      try {
        const selectedEventType = eventTypes.find(et => et.id === quickBookForm.event_type_id);
        if (!selectedEventType) return;
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const slots = await generateAvailableSlots(
          user.id,
          quickBookForm.event_type_id,
          quickBookDate,
          selectedEventType.duration,
          timezone,
          30 // 30 minute intervals
        );
        
        setAvailableSlots(slots);
        
        // Auto-select first available slot
        if (slots.length > 0 && !quickBookForm.meeting_time) {
          const firstSlot = slots[0];
          const slotDate = new Date(firstSlot.startTime);
          setQuickBookForm(prev => ({ 
            ...prev, 
            meeting_time: format(slotDate, 'HH:mm')
          }));
        }
      } catch (error) {
        console.error('Error loading available slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    loadAvailableSlots();
  }, [user, quickBookDate, quickBookForm.event_type_id, eventTypes]);
  
  /**
   * Open quick book modal for a specific date
   */
  const openQuickBook = (date: Date) => {
    setQuickBookDate(date);
    setQuickBookForm({
      event_type_id: eventTypes.length > 0 ? eventTypes[0].id : '',
      prospect_name: '',
      prospect_email: '',
      prospect_phone: '',
      meeting_time: '',
      meeting_method: '', // Reset meeting_method
      notes: '',
    });
    setQuickBookError('');
    setContactMode('existing');
    setSelectedContactId('');
    setSaveAsContact(true);
    setShowQuickBook(true);
  };

  /**
   * Close quick book modal
   */
  const closeQuickBook = () => {
    setShowQuickBook(false);
    setQuickBookDate(null);
    setQuickBookError('');
    setAvailableSlots([]);
    setContactMode('existing');
    setSelectedContactId('');
  };
  
  /**
   * Handle contact selection from existing contacts
   */
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setQuickBookForm(prev => ({
        ...prev,
        prospect_name: contact.full_name,
        prospect_email: contact.email,
        prospect_phone: contact.phone_number || '',
      }));
    }
  };

  /**
   * Submit quick book form
   */
  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickBookDate) return;

    // Validate
    if (!quickBookForm.event_type_id) {
      setQuickBookError('Please select an event type');
      return;
    }
    if (!quickBookForm.meeting_time) {
      setQuickBookError('Please select a meeting time');
      return;
    }
    if (!quickBookForm.prospect_name || quickBookForm.prospect_name.length < 2) {
      setQuickBookError('Please enter a valid name (min 2 characters)');
      return;
    }
    if (!quickBookForm.prospect_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickBookForm.prospect_email)) {
      setQuickBookError('Please enter a valid email address');
      return;
    }

    const selectedEventType = eventTypes.find(et => et.id === quickBookForm.event_type_id);
    if (!selectedEventType) {
      setQuickBookError('Invalid event type selected');
      return;
    }

    // Create booking time
    const [hours, minutes] = quickBookForm.meeting_time.split(':').map(Number);
    const startTime = new Date(quickBookDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + selectedEventType.duration * 60000);

    // Check if in past
    if (startTime < new Date()) {
      setQuickBookError('Cannot book a meeting in the past');
      return;
    }

    setQuickBookSubmitting(true);
    setQuickBookError('');

    try {
      // If adding a new contact and saveAsContact is true, save to contacts first
      if (contactMode === 'new' && saveAsContact && quickBookForm.prospect_phone) {
        const contactResult = await createContact(user.id, {
          full_name: quickBookForm.prospect_name,
          email: quickBookForm.prospect_email,
          phone_number: quickBookForm.prospect_phone,
        });
        
        if (contactResult.success && contactResult.contact) {
          // Add the new contact to local state
          setContacts(prev => [...prev, contactResult.contact!].sort((a, b) => 
            a.full_name.localeCompare(b.full_name)
          ));
        }
        // Don't fail the booking if contact save fails - just log it
        if (!contactResult.success) {
          console.warn('Contact not saved:', contactResult.error);
        }
      }
      
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          event_type_id: quickBookForm.event_type_id,
          guest_name: quickBookForm.prospect_name,
          guest_email: quickBookForm.prospect_email,
          guest_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: quickBookForm.notes || null,
          meeting_method: quickBookForm.meeting_method || null, // Save meeting_method
          status: 'confirmed',
        })
        .select(`*, event_types (*)`)
        .single();

      if (error) throw error;

      // Add to local state
      setBookings(prev => [...prev, newBooking as BookingWithEventType].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));

      // Send email notifications (don't block on these)
      if (hostProfile) {
        const bookingWithEventType = newBooking as BookingWithEventType;
        const eventTypeData = bookingWithEventType.event_types;
        
        // Send confirmation to guest
        sendBookingConfirmation(
          newBooking as any,
          eventTypeData as any,
          quickBookForm.prospect_email,
          quickBookForm.prospect_name,
          hostProfile as any
        ).catch(err => console.error('Failed to send guest confirmation:', err));
        
        // Send notification to host
        sendBookingNotificationToHost(
          newBooking as any,
          eventTypeData as any,
          quickBookForm.prospect_name,
          quickBookForm.prospect_email,
          hostProfile as any
        ).catch(err => console.error('Failed to send host notification:', err));
      }

      closeQuickBook();
      setSelectedDate(quickBookDate);
      alert(`✅ Meeting booked with ${quickBookForm.prospect_name}! Confirmation emails sent.`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setQuickBookError('Failed to create booking. Please try again.');
    } finally {
      setQuickBookSubmitting(false);
    }
  };

  // ============================================
  // BOOKING ACTIONS: Cancel & Reschedule
  // ============================================
  
  /**
   * Cancel a booking (host action)
   * This releases the time slot for other users
   */
  const handleCancelBooking = async (booking: BookingWithEventType) => {
    const confirmMessage = `Are you sure you want to cancel the booking with ${booking.guest_name}?\n\nThis will:\n• Free up the time slot\n• Notify the guest via email`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setActionLoading(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: booking.notes 
            ? `${booking.notes}\n\n[Cancelled by host on ${new Date().toLocaleDateString()}]`
            : `[Cancelled by host on ${new Date().toLocaleDateString()}]`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id 
          ? { ...b, status: 'cancelled' as const }
          : b
      ));

      // Send cancellation email to guest
      if (hostProfile && booking.guest_email) {
        sendCancellationConfirmation(
          booking as any,
          booking.event_types as any,
          booking.guest_email,
          booking.guest_name,
          hostProfile as any
        ).catch(err => console.error('Failed to send cancellation email:', err));
      }

      alert(`✅ Booking with ${booking.guest_name} has been cancelled. Notification sent.`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('❌ Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Open reschedule modal for editing booking time
   */
  const handleRescheduleBooking = (booking: BookingWithEventType) => {
    setEditingBooking(booking);
  };

  /**
   * Update booking with new time
   */
  const handleUpdateBookingTime = async (bookingId: string, newStartTime: Date) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const duration = booking.event_types.duration;
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    setActionLoading(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      const updatedBooking = { 
        ...booking, 
        start_time: newStartTime.toISOString(), 
        end_time: newEndTime.toISOString(), 
        status: 'confirmed' as const 
      };
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? updatedBooking : b
      ));

      // Send reschedule notification to guest
      if (hostProfile && booking.guest_email) {
        sendRescheduleConfirmation(
          booking as any,  // old booking
          updatedBooking as any,  // new booking
          booking.event_types as any,
          booking.guest_email,
          booking.guest_name,
          hostProfile as any
        ).catch(err => console.error('Failed to send reschedule email:', err));
      }

      setEditingBooking(null);
      alert('✅ Booking time updated! Notification sent to guest.');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('❌ Failed to update booking. The time slot may be taken.');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Check if booking can be modified (is in the future)
   */
  const canModifyBooking = (booking: BookingWithEventType): boolean => {
    return isBefore(new Date(), new Date(booking.start_time)) && booking.status === 'confirmed';
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.start_time), date)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Calculate padding days for calendar grid
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    function setActiveTab(arg0: string): void {
        throw new Error('Function not implemented.');
    }

  return (
    <div>
      {/* Tab UI */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
      </div>
      {/* Only show calendar UI */}
      <div>
        {/* Header with Purple Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">📆 Calendar View</h1>
              <p className="text-purple-100 text-lg">
                View all your appointments in calendar format
              </p>
            </div>
            
            <button
              onClick={handleToday}
              className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
            >
              🗓️ Today
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100 space-y-6">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-purple-200 rounded-xl overflow-hidden shadow-md">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="bg-gradient-to-br from-purple-100 to-pink-100 py-3 text-center text-xs font-bold text-purple-900"
                  >
                    {day}
                  </div>
                ))}

                {/* Padding days */}
                {paddingDays.map((_, index) => (
                  <div key={`padding-${index}`} className="bg-white min-h-24"></div>
                ))}

                {/* Calendar days */}
                {daysInMonth.map((date) => {
                  const dayBookings = getBookingsForDate(date);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isCurrentDay = isToday(date);
                  const isPastDate = isBefore(date, new Date()) && !isToday(date);
                  const isDragOver = dragOverDate && isSameDay(date, dragOverDate);
                  const canDropHere = !isPastDate && draggedBooking !== null;

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      onDragOver={canDropHere ? (e) => handleDragOver(e, date) : undefined}
                      onDragLeave={handleDragLeave}
                      onDrop={canDropHere ? (e) => handleDrop(e, date) : undefined}
                      className={`bg-white min-h-24 p-2 text-left hover:bg-purple-50 transition-colors relative cursor-pointer group ${
                        !isSameMonth(date, currentDate) ? 'text-gray-400' : ''
                      } ${isSelected ? 'ring-2 ring-purple-500 ring-inset bg-purple-50' : ''} ${
                        isDragOver ? 'ring-2 ring-green-500 ring-inset bg-green-50' : ''
                      } ${isPastDate ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                            isCurrentDay
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-gray-900'
                          }`}
                        >
                          {format(date, 'd')}
                        </span>
                        
                        {/* Quick Book Button - shows on hover for future dates */}
                        {!isPastDate && eventTypes.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickBook(date);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-purple-200 rounded-full text-purple-600"
                            title="Book a meeting"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {dayBookings.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayBookings.slice(0, 2).map((booking) => (
                            <div
                              key={booking.id}
                              draggable={canModifyBooking(booking)}
                              onDragStart={(e) => handleDragStart(e, booking)}
                              onDragEnd={handleDragEnd}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                canModifyBooking(booking) ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''
                              } ${draggedBooking?.id === booking.id ? 'opacity-50 ring-1 ring-purple-400' : ''}`}
                              style={{
                                backgroundColor:
                                  booking.status === 'cancelled'
                                    ? '#fee2e2' // red-100
                                    : booking.status === 'confirmed'
                                    ? '#dcfce7' // green-100
                                    : booking.event_types.color + '20',
                                color:
                                  booking.status === 'cancelled'
                                    ? '#b91c1c' // red-700
                                    : booking.status === 'confirmed'
                                    ? '#15803d' // green-700
                                    : booking.event_types.color,
                              }}
                              title={canModifyBooking(booking) ? 'Drag to reschedule' : undefined}
                            >
                              {format(new Date(booking.start_time), 'h:mm a')}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayBookings.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Drop indicator */}
                      {isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-100 bg-opacity-80 rounded pointer-events-none">
                          <span className="text-green-700 text-xs font-semibold">Drop here</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Details */}
              {selectedDate && (
                <div className="border-t-2 border-purple-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    
                    {/* Book Meeting Button for selected date */}
                    {!isBefore(selectedDate, new Date()) || isToday(selectedDate) ? (
                      eventTypes.length > 0 && (
                        <button
                          onClick={() => openQuickBook(selectedDate)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Book a Meeting
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 italic">Past date</span>
                    )}
                  </div>

                  {selectedBookings.length === 0 ? (
                    <div className="text-center py-8 bg-purple-50 rounded-xl">
                      <p className="text-gray-600 text-sm">No appointments scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-start space-x-4 p-5 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-colors bg-white shadow-sm"
                        >
                          <div
                            className="w-1.5 h-full rounded-full"
                            style={{ backgroundColor: booking.event_types.color }}
                          ></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">
                                {booking.event_types.title}
                              </h4>
                              <span
                                className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {booking.status === 'confirmed' ? '✓ Confirmed' : 
                                 booking.status === 'cancelled' ? '✗ Cancelled' : '⏳ Rescheduled'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              🕐 {format(new Date(booking.start_time), 'h:mm a')} -{' '}
                              {format(new Date(booking.end_time), 'h:mm a')}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>👤 Guest:</strong> {booking.guest_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>✉️ Email:</strong> {booking.guest_email}
                            </p>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mt-2 p-3 bg-purple-50 rounded-lg">
                                <strong>📝 Notes:</strong> {booking.notes}
                              </p>
                            )}
                            
                            {/* ============================================ */}
                            {/* ACTION BUTTONS: Cancel & Reschedule */}
                            {/* ============================================ */}
                            {canModifyBooking(booking) && (
                              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                  onClick={() => handleRescheduleBooking(booking)}
                                  disabled={actionLoading === booking.id}
                                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking)}
                                  disabled={actionLoading === booking.id}
                                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === booking.id ? (
                                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                  Cancel Booking
                                </button>
                              </div>
                            )}
                            
                            {/* Show message for past/cancelled bookings */}
                            {!canModifyBooking(booking) && booking.status === 'confirmed' && (
                              <p className="text-xs text-gray-400 mt-3 italic">
                                ⏰ This booking has already passed
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <p className="text-sm font-semibold text-gray-600 mb-1">📊 Total This Month</p>
            <p className="text-3xl font-bold text-purple-600">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
            <p className="text-sm font-semibold text-gray-600 mb-1">✅ Confirmed</p>
            <p className="text-3xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-100">
            <p className="text-sm font-semibold text-gray-600 mb-1">❌ Cancelled</p>
            <p className="text-3xl font-bold text-red-600">
              {bookings.filter(b => b.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* RESCHEDULE MODAL */}
        {/* ============================================ */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">📅 Reschedule Booking</h2>
                  <button
                    onClick={() => setEditingBooking(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Current booking info */}
                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-purple-900 mb-2">Current Booking:</p>
                  <p className="text-sm text-purple-700">
                    <strong>{editingBooking.guest_name}</strong> - {editingBooking.event_types.title}
                  </p>
                  <p className="text-sm text-purple-600">
                    {format(new Date(editingBooking.start_time), 'EEEE, MMMM d, yyyy')} at{' '}
                    {format(new Date(editingBooking.start_time), 'h:mm a')}
                  </p>
                </div>
                
                {/* New time selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Date
                    </label>
                    <input
                      type="date"
                      id="reschedule-date"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      defaultValue={format(new Date(editingBooking.start_time), 'yyyy-MM-dd')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Time
                    </label>
                    <input
                      type="time"
                      id="reschedule-time"
                      defaultValue={format(new Date(editingBooking.start_time), 'HH:mm')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditingBooking(null)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const dateInput = document.getElementById('reschedule-date') as HTMLInputElement;
                      const timeInput = document.getElementById('reschedule-time') as HTMLInputElement;
                      if (dateInput && timeInput) {
                        const newDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
                        if (newDateTime > new Date()) {
                          handleUpdateBookingTime(editingBooking.id, newDateTime);
                        } else {
                          alert('Please select a future date and time');
                        }
                      }
                    }}
                    disabled={actionLoading === editingBooking.id}
                    className="flex-1 px-4 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === editingBooking.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Update Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* QUICK BOOK MODAL */}
        {/* ============================================ */}
        {showQuickBook && quickBookDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">📅 Quick Book a Meeting</h2>
                  <button
                    onClick={closeQuickBook}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Book a meeting for <strong>{format(quickBookDate, 'EEEE, MMMM d, yyyy')}</strong>
                </p>
              </div>
              
              <form onSubmit={handleQuickBookSubmit} className="p-6 space-y-4">
                {/* Error Display */}
                {quickBookError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    ❌ {quickBookError}
                  </div>
                )}
                
                {/* Event Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={quickBookForm.event_type_id}
                    onChange={(e) => {
                      setQuickBookForm(prev => ({ ...prev, event_type_id: e.target.value, meeting_time: '' }));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select an event type</option>
                    {eventTypes.map(et => (
                      <option key={et.id} value={et.id}>
                        {et.title} ({et.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Meeting Time - Available Slots Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Time Slots *
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 text-sm">Loading available slots...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <select
                      value={quickBookForm.meeting_time}
                      onChange={(e) => setQuickBookForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select a time slot</option>
                      {availableSlots.map(slot => (
                        <option key={slot.id} value={format(new Date(slot.startTime), 'HH:mm')}>
                          {slot.displayTime}
                        </option>
                      ))}
                    </select>
                  ) : quickBookForm.event_type_id ? (
                    <div className="px-4 py-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-yellow-700 text-sm">
                      ⚠️ No available slots for this date. Try another date or check your availability settings.
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm">
                      Select an event type to see available slots
                    </div>
                  )}
                </div>
                
                {/* Contact Selection Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guest Contact
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode('existing');
                        setQuickBookForm(prev => ({ ...prev, prospect_name: '', prospect_email: '', prospect_phone: '' }));
                        setSelectedContactId('');
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        contactMode === 'existing'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📋 Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode('new');
                        setQuickBookForm(prev => ({ ...prev, prospect_name: '', prospect_email: '', prospect_phone: '' }));
                        setSelectedContactId('');
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        contactMode === 'new'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ➕ Add New
                    </button>
                  </div>
                </div>
                
                {/* Existing Contact Selection */}
                {contactMode === 'existing' && (
                  <div>
                    <select
                      value={selectedContactId}
                      onChange={(e) => handleContactSelect(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.full_name} ({contact.email})
                        </option>
                      ))}
                    </select>
                    {contacts.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No contacts found. Switch to "Add New" to create a contact.
                      </p>
                    )}
                  </div>
                )}
                
                {/* New Contact Form */}
                {contactMode === 'new' && (
                  <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={quickBookForm.prospect_name}
                        onChange={(e) => setQuickBookForm(prev => ({ ...prev, prospect_name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                        minLength={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={quickBookForm.prospect_email}
                        onChange={(e) => setQuickBookForm(prev => ({ ...prev, prospect_email: e.target.value }))}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={quickBookForm.prospect_phone}
                        onChange={(e) => setQuickBookForm(prev => ({ ...prev, prospect_phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* Save to Contacts Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={saveAsContact}
                        onChange={(e) => setSaveAsContact(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Save to my contacts</span>
                    </label>
                  </div>
                )}
                
                {/* Show selected contact info if using existing */}
                {contactMode === 'existing' && selectedContactId && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">👤 {quickBookForm.prospect_name}</p>
                    <p className="text-xs text-green-700">✉️ {quickBookForm.prospect_email}</p>
                    {quickBookForm.prospect_phone && (
                      <p className="text-xs text-green-700">📞 {quickBookForm.prospect_phone}</p>
                    )}
                  </div>
                )}
                
                {/* Meeting Method */}
                <div>
                  <label htmlFor="meeting_method" className="block text-sm font-semibold text-gray-900 mb-2">
                    Meeting Method <span className="text-gray-500">(e.g., Zoom, Phone, In Person)</span>
                  </label>
                  <input
                    type="text"
                    id="meeting_method"
                    name="meeting_method"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={quickBookForm.meeting_method}
                    onChange={e => setQuickBookForm(prev => ({ ...prev, meeting_method: e.target.value }))}
                    placeholder="Enter meeting method"
                    maxLength={100}
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={quickBookForm.notes}
                    onChange={(e) => setQuickBookForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes for this meeting..."
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeQuickBook}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickBookSubmitting || !quickBookForm.meeting_time || !quickBookForm.prospect_name || !quickBookForm.prospect_email}
                    className="flex-1 px-4 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {quickBookSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Booking...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Book Meeting
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
