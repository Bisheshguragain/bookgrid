# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CALENDLY CLONE SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React)                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   PUBLIC    │  │   PROTECTED  │  │   SHARED LAYOUT  │    │
│  │   ROUTES   │  │    ROUTES    │  │  (Header, etc)   │    │
│  ├─────────────┤  ├──────────────┤  └──────────────────┘    │
│  │ /login      │  │ /dashboard   │                           │
│  │ /signup     │  │ /event-types │  ┌──────────────────┐    │
│  │ /u/:user    │  │ /availability│  │   STATE MGMT     │    │
│  │ /book/:id   │  │ /analytics   │  │  (Zustand Auth)  │    │
│  │ /reschedule │  │ /settings    │  └──────────────────┘    │
│  │ /cancel     │  │ /reminders   │                           │
│  └─────────────┘  └──────────────┘                           │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              COMPONENT HIERARCHY                        │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────┐    │  │
│  │  │  AUTH FORM  │  │   BOOKING  │  │    MODALS    │    │  │
│  │  │ COMPONENTS  │  │ COMPONENTS │  │  COMPONENTS  │    │  │
│  │  ├─────────────┤  ├────────────┤  ├──────────────┤    │  │
│  │  │LoginForm    │  │SlotSelect  │  │EventDetails  │    │  │
│  │  │SignUpForm   │  │BookingForm │  │Modal         │    │  │
│  │  │ForgotPass   │  │BookingConf │  └──────────────┘    │  │
│  │  └─────────────┘  └────────────┘                       │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌──────────────────────────────────────────────────────────────┐
│                    API LAYER (Supabase)                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Supabase Client (src/lib/supabase.ts)          │  │
│  │  ├─ Authentication (Supabase Auth)                     │  │
│  │  ├─ Database Queries (PostgreSQL)                      │  │
│  │  ├─ Real-time Subscriptions (Ready)                    │  │
│  │  └─ Storage (If needed)                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ PostgreSQL Wire Protocol
                            │
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (PostgreSQL)                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  USERS_PROFILE│  │  EVENT_TYPES │  │  AVAILABILITY    │  │
│  │  (Primary)    │  │  (Bookable)  │  │  RULES           │  │
│  ├───────────────┤  ├──────────────┤  ├──────────────────┤  │
│  │ id (PK)       │  │ id (PK)      │  │ id (PK)          │  │
│  │ email         │  │ user_id (FK) │  │ user_id (FK)     │  │
│  │ full_name     │  │ title        │  │ day_of_week      │  │
│  │ username      │  │ duration     │  │ start_time       │  │
│  │ time_zone     │  │ location_type│  │ end_time         │  │
│  │ avatar_url    │  │ is_active    │  │ buffer_before    │  │
│  └───────────────┘  └──────────────┘  │ buffer_after     │  │
│                                         └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  BOOKINGS    │  │  REMINDERS   │  │  INDEX           │  │
│  │  (Core)      │  │  (Config)    │  │  POLICIES (RLS)  │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤  │
│  │ id (PK)      │  │ id (PK)      │  │ users_profile    │  │
│  │ user_id (FK) │  │ user_id (FK) │  │ event_types      │  │
│  │ event_id(FK) │  │ event_id(FK) │  │ availability     │  │
│  │ guest_name   │  │ offset_mins  │  │ bookings         │  │
│  │ guest_email  │  │ enabled      │  │ reminders        │  │
│  │ start_time   │  │ sent_at      │  └──────────────────┘  │
│  │ end_time     │  └──────────────┘                        │  │
│  │ status       │                                           │  │
│  │ notes        │                                           │  │
│  │ reschedule   │                                           │  │
│  │ _token       │                                           │  │
│  │ cancel_token │                                           │  │
│  └──────────────┘                                           │  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Public Booking Flow
```
Guest visits /u/username
    ↓
Load EventType from DB
    ↓
SlotSelection Component
    ├─ Fetch availability_rules
    ├─ Load bookings for date
    └─ Calculate available slots
    ↓
Guest selects time
    ↓
BookingForm Component
    ├─ Collect name, email, timezone
    ├─ Validate with Zod
    └─ Show notes field
    ↓
Guest submits form
    ↓
Create booking in DB
    ├─ Insert into bookings table
    ├─ Generate tokens
    └─ Set status = 'confirmed'
    ↓
Show Confirmation
    ├─ Display booking details
    └─ Ready for reschedule/cancel links
```

### 2. Reschedule Flow
```
Guest clicks reschedule link
    ↓
Verify token matches booking.reschedule_token
    ↓
Show current appointment
    ↓
SlotSelection for new time
    ├─ Load availability again
    └─ Check for conflicts
    ↓
Guest selects new time
    ↓
Update booking in DB
    ├─ Set start_time = new time
    ├─ Set end_time = calculated
    ├─ Set status = 'rescheduled'
    └─ Update updated_at
    ↓
Email host about change (future)
    ↓
Show confirmation
```

### 3. Analytics Flow
```
User visits /analytics
    ↓
Apply date range filter
    ↓
Query bookings table
    ├─ Count by status
    ├─ Group by date
    └─ Group by event_type
    ↓
Calculate metrics
    ├─ Total, confirmed, cancelled
    ├─ Conversion rate
    └─ Average per day
    ↓
Prepare chart data
    ├─ LineChart: bookings over time
    ├─ PieChart: event type distribution
    └─ MetricsCards: summary stats
    ↓
Render with Recharts
    └─ Export CSV option
```

## Component Tree

```
App
├── BrowserRouter
│   ├── Routes
│   │   ├── /login → LoginForm
│   │   ├── /signup → SignUpForm
│   │   ├── /forgot-password → ForgotPasswordForm
│   │   ├── /u/:username → PublicBooking
│   │   │   ├── SlotSelection
│   │   │   ├── BookingForm
│   │   │   └── Confirmation
│   │   ├── /reschedule/:id/:token → Reschedule
│   │   │   ├── SlotSelection
│   │   │   └── Confirmation
│   │   ├── /cancel/:id/:token → Cancel
│   │   │   └── Confirmation
│   │   └── / (protected)
│   │       └── Layout
│   │           ├── Header
│   │           └── Routes
│   │               ├── /dashboard → Dashboard
│   │               ├── /event-types → EventTypes
│   │               ├── /availability → Availability
│   │               ├── /analytics → Analytics
│   │               │   ├── LineChart (Recharts)
│   │               │   ├── PieChart (Recharts)
│   │               │   └── CSV Export
│   │               ├── /settings → Settings
│   │               └── /reminders → Reminders
│   │
│   └── Modals (Context/Portal)
│       └── EventDetailsModal
│
└── Zustand Store
    └── authStore
        ├── user
        ├── profile
        ├── isAuthenticated
        └── setUser/logout
```

## Database Relationships

```
users_profile
    ├─ 1 → ∞ event_types
    ├─ 1 → ∞ availability_rules
    ├─ 1 → ∞ bookings
    └─ 1 → ∞ reminders

event_types
    ├─ ← users_profile (user_id FK)
    ├─ 1 → ∞ bookings
    └─ 1 → ∞ reminders

availability_rules
    └─ ← users_profile (user_id FK)

bookings
    ├─ ← users_profile (user_id FK)
    └─ ← event_types (event_type_id FK)

reminders
    ├─ ← users_profile (user_id FK)
    └─ ← event_types (event_type_id FK)
```

## Security Layers

```
┌────────────────────────────────────────┐
│       REQUEST SECURITY LAYER            │
├────────────────────────────────────────┤
│ • HTTPS/TLS encryption                  │
│ • CORS configuration                    │
│ • Rate limiting (future)                │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│       APPLICATION SECURITY LAYER        │
├────────────────────────────────────────┤
│ • Zod input validation                  │
│ • React Hook Form validation            │
│ • Token verification                    │
│ • User authentication check             │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│       DATABASE SECURITY LAYER           │
├────────────────────────────────────────┤
│ • Row Level Security (RLS) policies    │
│ • User ID scoping on all queries       │
│ • Token-based access control           │
│ • Secure function policies              │
└────────────────────────────────────────┘
```

## State Management Flow

```
Zustand Auth Store (Global)
    ↓
User Login/Signup
    ├─ setUser(session.user)
    ├─ Load profile from DB
    └─ Update profile in store
    ↓
Protected Routes Check
    ├─ Read isAuthenticated
    └─ Redirect if not auth
    ↓
Component Level State (Local)
    ├─ useForm() for forms
    ├─ useState() for UI state
    └─ useEffect() for side effects
    ↓
Database Queries
    └─ Always include user_id
```

## Build & Deployment Architecture

```
┌─ Source Code (TypeScript, React)
│
├─ Vite Build Process
│  ├─ TypeScript compilation
│  ├─ JSX to JavaScript
│  ├─ CSS processing (Tailwind)
│  └─ Asset optimization
│
├─ Production Build
│  ├─ Minified JS/CSS
│  ├─ Source maps (optional)
│  └─ Static assets optimized
│
└─ Deployment Target
   ├─ Vercel/Netlify (recommended)
   ├─ Docker container
   └─ Self-hosted (VPS)
```

## Environment Configuration

```
Development
├─ localhost:5173
├─ Vite dev server
└─ Hot Module Replacement

Staging  
├─ staging domain
├─ Full feature set
└─ Test database

Production
├─ calendly-clone.com
├─ Optimized build
└─ Production database (Supabase)
```

---

**Architecture Version**: 1.0  
**Last Updated**: December 27, 2025  
**Status**: Complete and documented
