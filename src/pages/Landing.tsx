import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, CalendarIcon, ClockIcon, UserGroupIcon, VideoCameraIcon, BellIcon } from '@heroicons/react/24/outline';

export function Landing() {
  const features = [
    {
      icon: CalendarIcon,
      title: 'Easy Scheduling',
      description: 'Create and manage multiple event types with custom durations and locations.',
    },
    {
      icon: ClockIcon,
      title: 'Availability Management',
      description: 'Set your working hours and buffers automatically across all your calendars.',
    },
    {
      icon: UserGroupIcon,
      title: 'Guest Management',
      description: 'Seamlessly manage attendees with automatic confirmations and reminders.',
    },
    {
      icon: VideoCameraIcon,
      title: 'Integrations',
      description: 'Connect with Zoom, Google Meet, and other popular meeting platforms.',
    },
    {
      icon: BellIcon,
      title: 'Smart Reminders',
      description: 'Automated email reminders keep everyone on the same page.',
    },
    {
      icon: CheckCircleIcon,
      title: 'Analytics',
      description: 'Track booking trends and optimize your scheduling with detailed insights.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Your Account',
      description: 'Sign up in seconds with your email address.',
    },
    {
      number: '2',
      title: 'Set Your Availability',
      description: 'Define your working hours and meeting buffers.',
    },
    {
      number: '3',
      title: 'Add Event Types',
      description: 'Create different meeting types (consultations, demos, 1-on-1s, etc.)',
    },
    {
      number: '4',
      title: 'Share Your Link',
      description: 'Get a unique booking link to share with clients and prospects.',
    },
    {
      number: '5',
      title: 'Receive Bookings',
      description: 'Guests book directly into your calendar instantly.',
    },
    {
      number: '6',
      title: 'Automate Reminders',
      description: 'Let the system handle confirmations and reminders automatically.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Startup Founder',
      image: '👩‍💼',
      quote: 'This calendar app has saved me hours every week. No more back-and-forth emails!',
    },
    {
      name: 'Mike Chen',
      role: 'Sales Manager',
      image: '👨‍💼',
      quote: 'The simplicity and reliability are unmatched. My team uses it daily.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Consultant',
      image: '👩‍🔬',
      quote: 'Finally, a scheduling tool that actually respects my time and my clients\' time.',
    },
  ];

  const [menuOpen, setMenuOpen] = useState(false);

  // Calculate header offset for hero section
  // 40px (contact) + 80px (header) mobile, 44px + 88px desktop
  const heroOffset = typeof window !== 'undefined' && window.innerWidth >= 768 ? 132 : 120;

  return (
    <div className="w-full">
      {/* Top Contact Header - white background, purple bold text, larger and fixed */}
      <div className="w-full fixed top-0 left-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-end px-4 py-2 md:py-2 text-purple-700 font-bold text-sm md:text-base whitespace-nowrap flex-nowrap overflow-x-auto gap-4">
          <span className="inline-block whitespace-nowrap">book@bookagreed.com</span>
          <span className="inline-block">|</span>
          <span className="inline-block whitespace-nowrap">075 3931 9277</span>
        </div>
      </div>

      {/* Navigation with logo image restored, offset for fixed header */}
      <div className="w-full fixed top-[40px] md:top-[44px] left-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between px-4 py-3 md:py-4">
          <Link to="/" className="flex items-center select-none">
            <img 
              src="/BookAgreed%20logo.jpg" 
              alt="BookAgreed" 
              className="h-20 max-h-16 w-auto object-contain select-none pointer-events-none"
              draggable="false"
              style={{userSelect: 'none'}}
            />
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
              Sign In
            </Link>
            <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Get Started
            </Link>
          </div>
          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-600" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex md:hidden" onClick={() => setMenuOpen(false)}>
          <nav
            className="bg-white w-11/12 max-w-xs h-full shadow-xl p-6 flex flex-col gap-6 animate-slide-in-left relative justify-center items-center"
            onClick={e => e.stopPropagation()}
            aria-label="Mobile navigation menu"
          >
            <button
              className="absolute top-4 right-4 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-600"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <Link to="/login" className="w-full text-center text-primary-700 hover:text-primary-900 font-bold text-2xl py-4 bg-primary-50 rounded-lg shadow mb-4 transition-colors" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/signup" className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-lg font-bold text-2xl shadow-lg transition-colors" onClick={() => setMenuOpen(false)}>
              Get Started
            </Link>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <div
        className="w-full flex flex-col items-center justify-center text-center px-4"
        style={{
          marginTop: heroOffset,
        }}
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Scheduling Made
          <span className="block text-primary-600">Effortlessly Simple</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Stop playing email tag. Let your clients book time with you directly. Modern scheduling that respects everyone's time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl">
            Start Free Today
          </Link>
          <Link to="#pricing" onClick={(e) => {
            e.preventDefault();
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          }} className="border-2 border-gray-300 hover:border-primary-600 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
            View Pricing
          </Link>
        </div>
        <p className="text-gray-600 mt-6">
          <span className="font-semibold">Free forever plan available</span> • No credit card required • 5-minute setup
        </p>
      </div>
      <style>
      {`
      @media (min-width: 768px) {
        .hero-offset {
          margin-top: 120px !important; /* 44px contact + 76px header */
        }
      }
      `}
      </style>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern teams and entrepreneurs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  tabIndex={0}
                  className="group relative bg-gradient-to-br from-purple-100 to-purple-200 p-8 rounded-2xl border-2 border-purple-200 hover:border-primary-600 focus:border-primary-700 hover:shadow-2xl focus:shadow-2xl transition-all duration-300 outline-none cursor-pointer feature-box w-full max-w-xs mx-auto"
                >
                  {/* Icon container */}
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300 border-2 border-purple-200 group-hover:border-primary-600 group-focus:border-primary-700 mx-auto">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-700 mb-3 group-hover:text-primary-800 group-focus:text-primary-900 transition-colors text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 group-focus:text-gray-900 font-medium text-center">
                    {feature.description}
                  </p>
                  {/* Decorative accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100 opacity-0 group-hover:opacity-30 group-focus:opacity-40 transition-opacity duration-300 rounded-bl-3xl -z-10"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <style>
      {`
      .feature-box:focus, .feature-box:hover {
        box-shadow: 0 8px 32px 0 rgba(128, 90, 213, 0.25), 0 1.5px 6px 0 rgba(128, 90, 213, 0.10);
        border-width: 2px;
        border-color: #7c3aed;
      }
      `}
      </style>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get up and running in minutes with our simple 6-step process
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-600 text-white font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Loved by Users Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what people are saying about our scheduling solution
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-3">{testimonial.image}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                <div className="flex mt-4 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Upgrade Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Upgrade?
            </h2>
            <p className="text-xl text-gray-600">
              Scale your scheduling as your business grows
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Free, Grow Seamlessly</h3>
              <p className="text-gray-600 leading-relaxed">
                Begin with our free plan and upgrade when you're ready. No pressure, no lock-in. 
                Perfect for solopreneurs testing the waters or small teams just getting started.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pro Features for Professionals</h3>
              <p className="text-gray-600 leading-relaxed">
                Unlock advanced analytics, integrations, and custom branding. 
                Handle more bookings, create more event types, and delight your clients with a premium experience.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Business-Grade Reliability</h3>
              <p className="text-gray-600 leading-relaxed">
                Our Business plan offers unlimited everything: event types, bookings, and priority support. 
                Built for growing teams that need enterprise-level features without enterprise complexity.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Transparent Pricing, No Surprises</h3>
              <p className="text-gray-600 leading-relaxed">
                What you see is what you get. No hidden fees, no surprise charges. 
                Cancel anytime, downgrade if needed. We're here to support your success, not lock you in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Start free. Upgrade as you grow.
            </p>
            <p className="text-base text-gray-500">
              No hidden fees. Cancel anytime. All plans include core scheduling features.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-8 md:grid md:grid-cols-3 md:gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg transition-all w-full max-w-xs mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Free</h3>
              <div className="mb-6 text-center">
                <p className="text-5xl font-bold text-primary-600">
                  £0
                  <span className="text-lg text-gray-600">/month</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">Perfect for getting started</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>1 event type</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>100 bookings/month</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Basic availability settings</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Email reminders</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Public booking link</span>
                </li>
              </ul>
              <Link to="/signup" className="block w-full py-3 rounded-lg font-semibold transition-colors bg-gray-100 hover:bg-gray-200 text-gray-900 text-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="p-8 rounded-xl border-2 border-primary-600 bg-gradient-to-br from-primary-50 to-white shadow-xl md:scale-105 relative w-full max-w-xs mx-auto">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Pro</h3>
              <div className="mb-6 text-center">
                <p className="text-5xl font-bold text-primary-600">
                  £12
                  <span className="text-lg text-gray-600">/month</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">For professionals & growing teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>10 event types</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>1,000 bookings/month</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Advanced availability</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Custom branding</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Advanced reminders</span>
                </li>
              </ul>
              <Link to="/signup" className="block w-full py-3 rounded-lg font-semibold transition-colors bg-primary-600 hover:bg-primary-700 text-white text-center">
                Start Pro Trial
              </Link>
            </div>

            {/* Business Plan */}
            <div className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg transition-all w-full max-w-xs mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Business</h3>
              <div className="mb-6 text-center">
                <p className="text-5xl font-bold text-primary-600">
                  £24
                  <span className="text-lg text-gray-600">/month</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">For scaling businesses</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited event types</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited bookings</strong></span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Advanced analytics & reports</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Team collaboration (coming soon)</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span>White-label options (coming soon)</span>
                </li>
              </ul>
              <Link to="/signup" className="block w-full py-3 rounded-lg font-semibold transition-colors bg-gray-100 hover:bg-gray-200 text-gray-900 text-center">
                Get Started
              </Link>
            </div>
          </div>

          {/* Feature Comparison Note */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              All plans include email reminders, time zone support, and mobile-friendly booking pages.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Scheduling?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who've simplified their lives with modern scheduling.
          </p>
          <Link to="/signup" className="inline-block bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg">
            Start Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">Features</a></li>
                <li><a href="#pricing" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">Pricing</a></li>
                <li><a href="#security" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2025 BookGrid. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
