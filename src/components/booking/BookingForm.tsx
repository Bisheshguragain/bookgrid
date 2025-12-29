import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../../utils/cn';

const bookingFormSchema = z.object({
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestTimeZone: z.string().min(1, 'Please select a timezone'),
  notes: z.string().optional(),
  // Honeypot field - should always be empty for real users
  website: z.string().max(0).optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
  loading?: boolean;
  userTimeZone?: string;
}

// Common timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time (MSK)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

export function BookingForm({
  onSubmit,
  loading = false,
  userTimeZone = 'America/New_York',
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestTimeZone: userTimeZone,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="guestName" className="block text-sm font-medium text-gray-900 mb-1">
          Your name
        </label>
        <input
          {...register('guestName')}
          type="text"
          id="guestName"
          placeholder="John Doe"
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
            errors.guestName
              ? 'border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        />
        {errors.guestName && (
          <p className="mt-1 text-sm text-red-600">{errors.guestName.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-900 mb-1">
          Email address
        </label>
        <input
          {...register('guestEmail')}
          type="email"
          id="guestEmail"
          placeholder="john@example.com"
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
            errors.guestEmail
              ? 'border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        />
        {errors.guestEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.guestEmail.message}</p>
        )}
      </div>

      {/* Timezone Field */}
      <div>
        <label htmlFor="guestTimeZone" className="block text-sm font-medium text-gray-900 mb-1">
          Your timezone
        </label>
        <select
          {...register('guestTimeZone')}
          id="guestTimeZone"
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
            errors.guestTimeZone
              ? 'border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors.guestTimeZone && (
          <p className="mt-1 text-sm text-red-600">{errors.guestTimeZone.message}</p>
        )}
      </div>

      {/* Notes Field */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-1">
          Notes (optional)
        </label>
        <textarea
          {...register('notes')}
          id="notes"
          placeholder="Add any additional information..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Honeypot Field - Hidden from real users, bots will fill it */}
      <input
        {...register('website')}
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          opacity: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          height: 0,
          width: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-2 px-4 rounded-lg font-medium transition-colors',
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        )}
      >
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  );
}
