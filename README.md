# BookAgreed - Production-Ready Scheduling Application

A comprehensive, production-grade scheduling application built with React, TypeScript, and Vite. BookAgreed provides powerful meeting scheduling with paid meeting support, multi-tier subscriptions, and analytics features.

## 🌟 About BookAgreed

BookAgreed is a modern scheduling platform that makes it easy to book meetings and manage your calendar. Built with the latest web technologies, it offers a seamless experience for both meeting organizers and attendees, with support for paid consultations and flexible subscription tiers.

## 🚀 Features

### Core Functionality
- **User Authentication**: Sign up, login, password reset with Supabase Auth
- **Event Type Management**: Create, edit, delete custom event types
- **Paid Meetings**: Support for paid and free meeting types with payment instructions
- **Subscription Tiers**: Free, Pro (£12/mo), and Business (£24/mo) plans
- **Rate Limiting**: Enforced limits on event types and monthly bookings per plan
- **Availability Configuration**: Set working hours, buffer times, time zones
- **Public Booking Pages**: Share booking links with time zone and payment info display
- **Real-time Scheduling**: Automatic slot generation and conflict prevention
- **Booking Management**: Dashboard with upcoming/past events, analytics
- **Reminders System**: Automated reminder notifications with payment details
- **Email Notifications**: Professional emails for confirmations, reminders, and cancellations
- **Subscription Management**: In-dashboard upgrade prompts with usage tracking

### Subscription Plans
- **Free**: 1 event type, 100 bookings/month, basic features
- **Pro**: 10 event types, 1,000 bookings/month, analytics, integrations, API access
- **Business**: Unlimited event types and bookings, custom branding, priority support, full API access

### Technical Features
- **Mobile Responsive**: Optimized for all device sizes with hamburger menu
- **Time Zone Support**: Global time zone conversion and display
- **Row Level Security**: Secure database access with PostgreSQL RLS
- **Real-time Updates**: Live data synchronization
- **Type Safety**: Full TypeScript coverage
- **Modern UI**: Tailwind CSS with professional design
- **Professional Branding**: BookAgreed logo and consistent brand identity

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **date-fns** - Date manipulation and formatting
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend as a service
- **PostgreSQL** - Relational database
- **Row Level Security** - Database-level security
- **Supabase Auth** - Authentication service
- **Supabase Realtime** - Real-time subscriptions

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd Calendly
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the initial database schema:
   ```sql
   -- Copy and run contents of src/lib/database-schema.sql
   ```
3. Run the payment fields migration:
   ```sql
   -- Copy and run contents of migrations/add_payment_fields.sql
   ```
4. Run the subscription system migration:
   ```sql
   -- Copy and run contents of migrations/add_subscription_tiers.sql
   ```
5. (Optional) Add sample data:
   ```sql
   -- Copy and run contents of src/lib/sample-data.sql
   ```

### 4. Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Layout)
│   ├── subscription/   # Subscription-related components
│   └── ui/             # Base UI components
├── lib/                # Core utilities and configuration
│   ├── database.types.ts    # TypeScript database types
│   ├── database-schema.sql  # PostgreSQL schema
│   ├── sample-data.sql     # Sample data for development
│   └── supabase.ts         # Supabase client configuration
├── pages/              # Page components
│   ├── Landing.tsx     # Landing page with pricing
│   ├── Dashboard.tsx   # Main dashboard
│   ├── EventTypes.tsx  # Event type management
│   ├── CreateEventType.tsx # Create new event types
│   ├── EditEventType.tsx   # Edit existing event types
│   ├── Availability.tsx    # Availability configuration
│   ├── Analytics.tsx       # Analytics dashboard
│   ├── PublicBooking.tsx   # Public booking page
│   ├── BookAMeet.tsx       # Internal booking page
│   └── Pricing.tsx         # Pricing and subscription page
├── services/           # Business logic services
│   ├── emailService.ts         # Email notification service
│   └── subscriptionService.ts  # Subscription management
├── store/              # State management
│   └── authStore.ts    # Authentication state
├── utils/              # Utility functions
│   ├── cn.ts          # Class name utility
│   └── datetime.ts    # Date/time utilities
├── migrations/         # Database migrations
│   ├── add_payment_fields.sql      # Payment feature migration
│   └── add_subscription_tiers.sql  # Subscription system migration
└── App.tsx            # Main application component
```

## 🔐 Security Features

### Database Security
- **Row Level Security (RLS)** enforced on all tables
- **User isolation** - users can only access their own data
- **Secure token-based** reschedule/cancel links
- **Input validation** with Zod schemas

### Authentication Security
- **Password strength** requirements (minimum 8 characters)
- **Email verification** on signup
- **Secure password reset** flow
- **No email enumeration** attacks prevention
- **Session management** with automatic token refresh

## 📊 Database Schema

### Core Tables
- `users_profile` - User profile information
- `event_types` - User-defined event types
- `availability_rules` - User availability windows
- `bookings` - Scheduled appointments
- `reminders` - Reminder notifications
- `global_settings` - User preferences

### Key Features
- **Foreign key constraints** ensure data integrity
- **Check constraints** validate data ranges
- **Indexes** for query performance
- **Triggers** for automatic timestamp updates
- **Functions** for complex analytics queries

## 🚀 Development

### Build for Production
```bash
npm run build
```

### Environment Configuration
Ensure these environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🎯 Roadmap

### Current Features ✅
- Core scheduling functionality
- User authentication with Supabase Auth
- Dashboard and analytics with Recharts
- Event type management (paid and free)
- Availability configuration with time zones
- Public booking pages with payment info
- Professional email notifications
- Subscription system (Free, Pro, Business)
- Rate limiting and feature enforcement
- Mobile-responsive design with hamburger menu
- Professional BookAgreed branding
- PDF export functionality

### Future Enhancements 📋
- Stripe payment integration for paid meetings
- Automated payment processing
- Calendar integrations (Google, Outlook)
- Video meeting auto-creation (Zoom, Google Meet)
- Team scheduling and collaboration features
- Advanced analytics and reporting
- Mobile app (React Native)
- Custom domain support
- White-label options
- Referral program

## 📚 Documentation

Comprehensive documentation is available:
- **COMPLETE_FEATURE_SUMMARY.md** - Full feature overview
- **BOOKGRID_REBRANDING.md** - Rebranding changes
- **BOOKGRID_BRAND_GUIDE.md** - Brand guidelines
- **PAID_MEETINGS_FEATURE.md** - Paid meetings system
- **FINAL_PAID_MEETINGS_SUMMARY.md** - Complete implementation
- **BOOK_A_MEET_PAID_INTEGRATION.md** - Email integration
- **SUBSCRIPTION_TIERS_IMPLEMENTATION.md** - Technical details
- **SUBSCRIPTION_QUICK_START.md** - Quick reference
- **SUBSCRIPTION_VISUAL_GUIDE.md** - Visual diagrams
- **FREE_TIER_SUMMARY.md** - Free tier specifics
- **LANDING_PAGE_UPDATE.md** - Landing page changes
- **LANDING_PAGE_VISUAL_GUIDE.md** - Landing page layout

## 📄 License

This project is licensed under the MIT License.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
