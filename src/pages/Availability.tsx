import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { getDayOfWeekName } from '../utils/datetime';
import type { AvailabilityRule } from '../lib/database.types';

// Helper function to format time from HH:MM:SS to HH:MM
const formatTime = (time: string): string => {
  if (!time) return '';
  // If time is already in HH:MM format, return as is
  if (time.length === 5) return time;
  // If time is in HH:MM:SS format, remove seconds
  return time.substring(0, 5);
};

export function Availability() {
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    buffer_before: 0,
    buffer_after: 0,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Holiday mode state
  const [holidayMode, setHolidayMode] = useState(false);
  const [holidayStart, setHolidayStart] = useState('');
  const [holidayEnd, setHolidayEnd] = useState('');
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [eventTypesBeforeHoliday, setEventTypesBeforeHoliday] = useState<string[]>([]);

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const loadAvailability = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('availability_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('day_of_week', { ascending: true });

        if (error) throw error;
        setAvailabilityRules(data || []);
        
        // Load holiday mode settings from user metadata or localStorage
        const savedHoliday = localStorage.getItem(`holiday_mode_${user.id}`);
        if (savedHoliday) {
          const holiday = JSON.parse(savedHoliday);
          const today = new Date().toISOString().split('T')[0];
          
          // Check if we're still in holiday period
          if (holiday.end >= today) {
            setHolidayMode(holiday.enabled);
            setHolidayStart(holiday.start);
            setHolidayEnd(holiday.end);
            if (holiday.deactivatedEventTypes) {
              setEventTypesBeforeHoliday(holiday.deactivatedEventTypes);
            }
          } else {
            // Holiday period has passed, clean up
            localStorage.removeItem(`holiday_mode_${user.id}`);
          }
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (formData.start_time >= formData.end_time) {
      newErrors.time = 'End time must be after start time';
    }
    
    if (formData.buffer_before < 0 || formData.buffer_before > 120) {
      newErrors.buffer_before = 'Buffer before must be between 0 and 120 minutes';
    }
    
    if (formData.buffer_after < 0 || formData.buffer_after > 120) {
      newErrors.buffer_after = 'Buffer after must be between 0 and 120 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('availability_rules')
          .update({
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            buffer_before: formData.buffer_before,
            buffer_after: formData.buffer_after,
          })
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        // Insert new rule
        const { error } = await supabase
          .from('availability_rules')
          .insert({
            user_id: user.id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            buffer_before: formData.buffer_before,
            buffer_after: formData.buffer_after,
          });

        if (error) throw error;
      }

      // Reset form and reload
      setFormData({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        buffer_before: 0,
        buffer_after: 0,
      });
      setShowAddForm(false);
      setEditingRule(null);
      
      // Reload availability rules
      const { data } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });
      
      setAvailabilityRules(data || []);
    } catch (error) {
      console.error('Error saving availability:', error);
      setErrors({ api: editingRule ? 'Failed to update availability rule' : 'Failed to add availability rule' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this availability rule?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('availability_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvailabilityRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const startEditRule = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setFormData({
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      buffer_before: rule.buffer_before || 0,
      buffer_after: rule.buffer_after || 0,
    });
    setShowAddForm(true);
    setErrors({});
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      buffer_before: 0,
      buffer_after: 0,
    });
    setShowAddForm(false);
    setErrors({});
  };

  const copyScheduleToAllDays = async (dayIndex: number) => {
    if (!user) return;
    
    const sourceRules = availabilityRules.filter(r => r.day_of_week === dayIndex);
    
    if (sourceRules.length === 0) {
      alert('No availability rules set for this day!');
      return;
    }
    
    const confirmMessage = `This will copy ${sourceRules.length} rule(s) from ${getDayOfWeekName(dayIndex)} to all other days. Existing rules on other days will be removed. Continue?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Delete all existing rules for other days
      const otherDays = [0, 1, 2, 3, 4, 5, 6].filter(d => d !== dayIndex);
      
      for (const day of otherDays) {
        await supabase
          .from('availability_rules')
          .delete()
          .eq('user_id', user.id)
          .eq('day_of_week', day);
      }
      
      // Insert copies of source rules for all other days
      const newRules = [];
      for (const day of otherDays) {
        for (const rule of sourceRules) {
          newRules.push({
            user_id: user.id,
            day_of_week: day,
            start_time: rule.start_time,
            end_time: rule.end_time,
            buffer_before: rule.buffer_before,
            buffer_after: rule.buffer_after,
          });
        }
      }
      
      if (newRules.length > 0) {
        const { error } = await supabase
          .from('availability_rules')
          .insert(newRules);
        
        if (error) throw error;
      }
      
      // Reload availability
      const { data } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });
      
      setAvailabilityRules(data || []);
      
      alert('✅ Schedule copied to all days successfully!');
    } catch (error) {
      console.error('Error copying schedule:', error);
      alert('❌ Failed to copy schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHolidayMode = async () => {
    if (!user) return;
    
    const newMode = !holidayMode;
    
    if (newMode) {
      // Enabling holiday mode
      if (!holidayStart || !holidayEnd) {
        alert('Please select holiday start and end dates first!');
        return;
      }
      
      if (holidayStart > holidayEnd) {
        alert('Holiday end date must be after start date!');
        return;
      }
      
      const confirmMessage = `This will deactivate all your event types from ${holidayStart} to ${holidayEnd}. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      setSavingHoliday(true);
      
      try {
        // Get all active event types
        const { data: eventTypes, error: fetchError } = await supabase
          .from('event_types')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (fetchError) throw fetchError;
        
        const activeEventTypeIds = eventTypes?.map(et => et.id) || [];
        
        // Deactivate all event types
        if (activeEventTypeIds.length > 0) {
          const { error: updateError } = await supabase
            .from('event_types')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .in('id', activeEventTypeIds);
          
          if (updateError) throw updateError;
          
          setEventTypesBeforeHoliday(activeEventTypeIds);
        }
        
        // Save holiday mode to localStorage
        const holidayData = {
          enabled: true,
          start: holidayStart,
          end: holidayEnd,
          deactivatedEventTypes: activeEventTypeIds,
        };
        
        localStorage.setItem(`holiday_mode_${user.id}`, JSON.stringify(holidayData));
        
        setHolidayMode(true);
        alert('🌴 Holiday mode enabled! All event types have been deactivated.');
      } catch (error) {
        console.error('Error enabling holiday mode:', error);
        alert('❌ Failed to enable holiday mode. Please try again.');
      } finally {
        setSavingHoliday(false);
      }
    } else {
      // Disabling holiday mode
      const confirmMessage = 'This will reactivate your event types that were active before holiday mode. Continue?';
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      setSavingHoliday(true);
      
      try {
        // Reactivate previously active event types
        if (eventTypesBeforeHoliday.length > 0) {
          const { error: updateError } = await supabase
            .from('event_types')
            .update({ is_active: true })
            .eq('user_id', user.id)
            .in('id', eventTypesBeforeHoliday);
          
          if (updateError) throw updateError;
        }
        
        // Clear holiday mode
        localStorage.removeItem(`holiday_mode_${user.id}`);
        setHolidayMode(false);
        setEventTypesBeforeHoliday([]);
        
        alert('✅ Holiday mode disabled! Your event types have been reactivated.');
      } catch (error) {
        console.error('Error disabling holiday mode:', error);
        alert('❌ Failed to disable holiday mode. Please try again.');
      } finally {
        setSavingHoliday(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group rules by day of week
  const rulesByDay = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    dayName: getDayOfWeekName(i),
    rules: availabilityRules.filter(r => r.day_of_week === i),
  }));

  return (
    <div className="space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">⏰ Availability</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Set your working hours and availability
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Availability
          </button>
        </div>
      </div>

      {/* Holiday Mode Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border-2 border-purple-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              🌴 Holiday Mode
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Temporarily disable all event types during your vacation or time off
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className={`text-sm font-semibold ${holidayMode ? 'text-purple-600' : 'text-gray-500'}`}>
              {holidayMode ? '🟢 Active' : '⚫ Inactive'}
            </span>
            <button
              onClick={toggleHolidayMode}
              disabled={savingHoliday}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                holidayMode ? 'bg-purple-600' : 'bg-gray-300'
              } ${savingHoliday ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  holidayMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="holiday_start" className="block text-sm font-semibold text-gray-900 mb-2">
              Holiday Start Date
            </label>
            <input
              type="date"
              id="holiday_start"
              value={holidayStart}
              onChange={(e) => setHolidayStart(e.target.value)}
              disabled={holidayMode}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="holiday_end" className="block text-sm font-semibold text-gray-900 mb-2">
              Holiday End Date
            </label>
            <input
              type="date"
              id="holiday_end"
              value={holidayEnd}
              onChange={(e) => setHolidayEnd(e.target.value)}
              disabled={holidayMode}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100"
            />
          </div>
        </div>

        {holidayMode && (
          <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <p className="text-sm text-purple-800 font-medium">
              ℹ️ Holiday mode is active from <strong>{holidayStart}</strong> to <strong>{holidayEnd}</strong>.
              All your event types are currently deactivated. Toggle off to reactivate them.
            </p>
          </div>
        )}
      </div>

      {/* Add Availability Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border-2 border-purple-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
            {editingRule ? '✏️ Edit Availability Rule' : '➕ Add Availability Rule'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.api && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                <div className="text-sm text-red-800 font-medium">{errors.api}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day of Week */}
              <div>
                <label htmlFor="day_of_week" className="block text-sm font-semibold text-gray-900 mb-2">
                  Day of Week <span className="text-purple-600">*</span>
                </label>
                <select
                  id="day_of_week"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  {Array.from({ length: 7 }, (_, i) => (
                    <option key={i} value={i}>
                      {getDayOfWeekName(i)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="start_time" className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Time <span className="text-purple-600">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-gray-900 mb-2">
                  End Time <span className="text-purple-600">*</span>
                </label>
                <input
                  type="time"
                  id="end_time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Buffer Before */}
              <div>
                <label htmlFor="buffer_before" className="block text-sm font-semibold text-gray-900 mb-2">
                  Buffer Before (minutes)
                </label>
                <input
                  type="number"
                  id="buffer_before"
                  min="0"
                  max="120"
                  value={formData.buffer_before}
                  onChange={(e) => setFormData(prev => ({ ...prev, buffer_before: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Buffer After */}
              <div>
                <label htmlFor="buffer_after" className="block text-sm font-semibold text-gray-900 mb-2">
                  Buffer After (minutes)
                </label>
                <input
                  type="number"
                  id="buffer_after"
                  min="0"
                  max="120"
                  value={formData.buffer_after}
                  onChange={(e) => setFormData(prev => ({ ...prev, buffer_after: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {errors.time && (
              <p className="text-sm text-red-600 font-medium">{errors.time}</p>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Saving...' : editingRule ? '💾 Update Rule' : '✅ Add Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Availability Calendar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {rulesByDay.map(({ dayIndex, dayName, rules }) => (
          <div key={dayIndex} className="bg-white rounded-xl p-4 sm:p-5 shadow-lg border-2 border-purple-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
              <h3 className="font-bold text-purple-900 text-base sm:text-lg">{dayName}</h3>
              {rules.length > 0 && (
                <button
                  onClick={() => copyScheduleToAllDays(dayIndex)}
                  disabled={isSubmitting}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                  title="Copy this day's schedule to all other days"
                >
                  📋 Copy to All
                </button>
              )}
            </div>
            
            {rules.length === 0 ? (
              <p className="text-sm text-gray-500 text-center italic py-4">No hours set</p>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="text-sm font-bold text-purple-900">
                      🕐 {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                    </div>
                    {(rule.buffer_before > 0 || rule.buffer_after > 0) && (
                      <div className="text-xs text-gray-700 mt-2 space-y-1">
                        {rule.buffer_before > 0 && <div>⏱️ Before: {rule.buffer_before}m</div>}
                        {rule.buffer_after > 0 && <div>⏱️ After: {rule.buffer_after}m</div>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        onClick={() => startEditRule(rule)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {availabilityRules.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-purple-200 shadow-md">
          <h3 className="font-bold text-purple-900 mb-2 text-base sm:text-lg">📊 Your Availability Summary</h3>
          <p className="text-sm sm:text-base text-purple-800">
            You have set availability for <strong>{new Set(availabilityRules.map(r => r.day_of_week)).size}</strong> day(s) of the week.
            Guests will be able to book time slots within these hours. 🎉
          </p>
        </div>
      )}
    </div>
  );
}
