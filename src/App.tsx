import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { ConnectionStatus } from './components/ConnectionStatus';

// Layout
import { Layout } from './components/layout/Layout';

// Auth components
import { LoginForm } from './components/auth/LoginForm';
import { SignUpForm } from './components/auth/SignUpForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EventTypes } from './pages/EventTypes';
import { CreateEventType } from './pages/CreateEventType';
import { EditEventType } from './pages/EditEventType';
import { CalendarView } from './pages/CalendarView';
import { Availability } from './pages/Availability';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Reminders } from './pages/Reminders';
import { BookAMeet } from './pages/BookAMeet';
import { PublicBooking } from './pages/PublicBooking';
import { Reschedule } from './pages/Reschedule';
import { Cancel } from './pages/Cancel';
import { Landing } from './pages/Landing';
import { DatabaseTest } from './pages/DatabaseTest';
import { Pricing } from './pages/Pricing';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiesPolicy } from './pages/CookiesPolicy';
import { Contact } from './pages/Contact';
import { HelpCenter } from './pages/HelpCenter';
import { About } from './pages/About';
import { Blog } from './pages/Blog';
import { Contacts } from './pages/Contacts';

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const setUser = useAuthStore(state => state.setUser);
  const loading = useAuthStore(state => state.loading);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        setUser(session?.user ?? null);
      })
      .catch((error: any) => {
        console.error('Error getting session:', error);
        // Set user to null on error to allow app to continue
        setUser(null);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ConnectionStatus />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Legal pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiesPolicy />} />

        {/* Company pages */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<HelpCenter />} />

        {/* Public auth routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignUpForm />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordForm />
          </PublicRoute>
        } />

        {/* Protected routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="superadmin" element={<SuperAdminDashboard />} />
          <Route path="event-types" element={<EventTypes />} />
          <Route path="event-types/new" element={<CreateEventType />} />
          <Route path="event-types/:id/edit" element={<EditEventType />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="availability" element={<Availability />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="book-a-meet" element={<BookAMeet />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="database-test" element={<DatabaseTest />} />
          <Route path="contacts" element={<Contacts />} />
        </Route>

        {/* Public booking routes (no auth required) */}
        <Route path="/u/:username" element={<PublicBooking />} />
        <Route path="/book/:eventTypeId" element={<PublicBooking />} />
        <Route path="/reschedule/:bookingId/:token" element={<Reschedule />} />
        <Route path="/cancel/:bookingId/:token" element={<Cancel />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
