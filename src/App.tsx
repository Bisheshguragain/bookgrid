import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { ConnectionStatus } from './components/ConnectionStatus';
import { initializeAnalytics, analytics } from './services/analytics';

// Layout
import { Layout } from './components/layout/Layout';

// Auth components (keep these for immediate loading)
import { LoginForm } from './components/auth/LoginForm';
import { SignUpForm } from './components/auth/SignUpForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';

// Public pages (keep landing and blog for SEO)
import { Landing } from './pages/Landing';
import { Blog } from './pages/Blog';
import BlogArticle from './pages/BlogArticle';

// Lazy load protected routes (reduces initial bundle size by ~70%)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const EventTypes = lazy(() => import('./pages/EventTypes').then(m => ({ default: m.EventTypes })));
const CreateEventType = lazy(() => import('./pages/CreateEventType').then(m => ({ default: m.CreateEventType })));
const EditEventType = lazy(() => import('./pages/EditEventType').then(m => ({ default: m.EditEventType })));
const CalendarView = lazy(() => import('./pages/CalendarView').then(m => ({ default: m.CalendarView })));
const Availability = lazy(() => import('./pages/Availability').then(m => ({ default: m.Availability })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Reminders = lazy(() => import('./pages/Reminders').then(m => ({ default: m.Reminders })));
const BookAMeet = lazy(() => import('./pages/BookAMeet').then(m => ({ default: m.BookAMeet })));
const PublicBooking = lazy(() => import('./pages/PublicBooking').then(m => ({ default: m.PublicBooking })));
const Reschedule = lazy(() => import('./pages/Reschedule').then(m => ({ default: m.Reschedule })));
const Cancel = lazy(() => import('./pages/Cancel').then(m => ({ default: m.Cancel })));
const DatabaseTest = lazy(() => import('./pages/DatabaseTest').then(m => ({ default: m.DatabaseTest })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const CookiesPolicy = lazy(() => import('./pages/CookiesPolicy').then(m => ({ default: m.CookiesPolicy })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then(m => ({ default: m.HelpCenter })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })));

// Loading component for lazy routes
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    analytics.pageview(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
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
    return <LoadingSpinner />;
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
    // Initialize Google Analytics
    initializeAnalytics();
    
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
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <ConnectionStatus />
      <Suspense fallback={<LoadingSpinner />}>
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
          <Route path="/blog/:id" element={<BlogArticle />} />
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
          <Route path="/reset-password" element={<ResetPasswordForm />} />

          {/* Protected routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="superadmin" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SuperAdminDashboard />
              </Suspense>
            } />
            <Route path="event-types" element={
              <Suspense fallback={<LoadingSpinner />}>
                <EventTypes />
              </Suspense>
            } />
            <Route path="event-types/new" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateEventType />
              </Suspense>
            } />
            <Route path="event-types/:id/edit" element={
              <Suspense fallback={<LoadingSpinner />}>
                <EditEventType />
              </Suspense>
            } />
            <Route path="calendar" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CalendarView />
              </Suspense>
            } />
            <Route path="availability" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Availability />
              </Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Analytics />
              </Suspense>
            } />
            <Route path="book-a-meet" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BookAMeet />
              </Suspense>
            } />
            <Route path="pricing" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Pricing />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Settings />
              </Suspense>
            } />
            <Route path="reminders" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Reminders />
              </Suspense>
            } />
            <Route path="database-test" element={
              <Suspense fallback={<LoadingSpinner />}>
                <DatabaseTest />
              </Suspense>
            } />
            <Route path="contacts" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Contacts />
              </Suspense>
            } />
          </Route>

          {/* Public booking routes (no auth required) */}
          <Route path="/u/:username" element={<PublicBooking />} />
          <Route path="/book/:eventTypeId" element={<PublicBooking />} />
          <Route path="/reschedule/:bookingId/:token" element={<Reschedule />} />
          <Route path="/cancel/:bookingId/:token" element={<Cancel />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
