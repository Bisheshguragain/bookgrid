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

  return (
    <div className="w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/BookGrid logo.2.jpg" 
              alt="BookGrid" 
              className="h-14"
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
              Sign In
            </Link>
            <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
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
      </section>

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorSchemes = [
                { bg: 'bg-blue-100', text: 'text-blue-600', border: 'hover:border-blue-300' },
                { bg: 'bg-purple-100', text: 'text-purple-600', border: 'hover:border-purple-300' },
                { bg: 'bg-green-100', text: 'text-green-600', border: 'hover:border-green-300' },
                { bg: 'bg-orange-100', text: 'text-orange-600', border: 'hover:border-orange-300' },
                { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'hover:border-cyan-300' },
                { bg: 'bg-pink-100', text: 'text-pink-600', border: 'hover:border-pink-300' },
              ];
              const colors = colorSchemes[index % colorSchemes.length];
              return (
                <div 
                  key={index} 
                  className={`group relative bg-white p-8 rounded-2xl border-2 border-gray-100 ${colors.border} hover:shadow-xl transition-all duration-300`}
                >
                  {/* Icon container */}
                  <div className={`w-16 h-16 rounded-xl ${colors.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${colors.text}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  
                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 ${colors.bg} opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-bl-3xl -z-10`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
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
            <div className="p-8 rounded-xl border-2 border-primary-600 bg-gradient-to-br from-primary-50 to-white shadow-xl md:scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="mb-6">
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
            <div className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="mb-6">
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
