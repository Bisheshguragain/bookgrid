import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeBookings } from '../../hooks/useRealtimeBookings';

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, profile, signOut } = useAuthStore();
  const { newBookingCount } = useRealtimeBookings({
    userId: user?.id || '',
    enabled: !!user?.id,
    channelName: 'header-bookings',
  });

  // Check if user is superadmin
  const isSuperAdmin = profile?.role === 'superadmin';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Event Types', href: '/app/event-types' },
    { name: 'Calendar', href: '/app/calendar' },
    { name: 'Availability', href: '/app/availability' },
    { name: 'Contacts', href: '/app/contacts' },
    { name: 'Analytics', href: '/app/analytics' },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/app/dashboard" className="flex items-center">
              <img 
                src="/BookAgreed%20logo.jpg" 
                alt="BookAgreed" 
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  isActiveRoute(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
                {item.name === 'Dashboard' && newBookingCount > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {newBookingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side: Mobile Menu Button + User Profile */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
              {newBookingCount > 0 && !isMobileMenuOpen && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {newBookingCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {profile?.full_name || user?.email}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  {isSuperAdmin && (
                    <p className="text-xs text-red-600 font-semibold mt-1">🔐 SuperAdmin</p>
                  )}
                </div>
                
                {isSuperAdmin && (
                  <Link
                    to="/app/superadmin"
                    className="block px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 border-b border-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    🔐 SuperAdmin Dashboard
                  </Link>
                )}
                
                <Link
                  to="/app/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Settings
                </Link>
                
                <Link
                  to="/app/reminders"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Reminders
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="lg:hidden absolute top-16 right-0 left-0 bg-white shadow-lg border-b border-gray-200 z-40 animate-slideDown"
        >
          <nav className="px-4 py-4 space-y-1 max-w-7xl mx-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActiveRoute(item.href)
                    ? 'text-primary-600 bg-primary-50 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{item.name}</span>
                {item.name === 'Dashboard' && newBookingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {newBookingCount} new
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
