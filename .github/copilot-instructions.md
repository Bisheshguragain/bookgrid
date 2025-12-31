# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is BookAgreed - a production-grade scheduling application built with React, TypeScript, and Vite. The application includes:

- User authentication and profile management
- Event type creation and management
- Availability configuration
- Public booking pages with time zone support
- Dashboard and analytics
- Reminders system
- Mobile-responsive design

## Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Date/Time**: date-fns, date-fns-tz
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Architecture Guidelines
- Use TypeScript strictly with proper type definitions
- Implement Row Level Security (RLS) for all database operations
- Follow React best practices with hooks and functional components
- Use Zustand for global state management
- Implement proper error handling and loading states
- Ensure mobile-first responsive design
- Follow security best practices for user data

## Database Schema
The application uses PostgreSQL with the following main tables:
- `users_profile`: User profile information
- `event_types`: User-defined event types
- `availability_rules`: User availability configuration
- `bookings`: Scheduled events
- `reminders`: Automated reminder system

## Security Considerations
- All database queries use Row Level Security
- User input validation with Zod schemas
- Secure token-based reschedule/cancel functionality
- No email enumeration in password reset flows
- Proper time zone handling for global users
