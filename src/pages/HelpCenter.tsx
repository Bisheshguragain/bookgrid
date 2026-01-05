import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SEO, SEO_CONFIGS } from '../components/SEO';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Creating an account is simple! Click the "Get Started" button on our homepage, enter your email address and create a password. You\'ll receive a confirmation email to verify your account. Once verified, you can start setting up your booking page right away.',
  },
  {
    category: 'Getting Started',
    question: 'How do I set up my first event type?',
    answer: 'After logging in, go to "Event Types" in your dashboard and click "Create Event Type". Give it a name (e.g., "30-minute Consultation"), set the duration, add a description, and configure any additional settings like location or buffer time. Save it, and you\'re ready to share your booking link!',
  },
  {
    category: 'Getting Started',
    question: 'What is a booking link and how do I share it?',
    answer: 'Your booking link is a unique URL (like bookagreed.com/u/yourname) that you can share with clients or prospects. They can visit this link anytime to see your available times and book a meeting with you. Find your link in the dashboard or under each event type.',
  },
  {
    category: 'Getting Started',
    question: 'Can I use BookAgreed for free?',
    answer: 'Yes! We offer a generous free plan that includes up to 2 event types, 20 bookings per month, email reminders, and a mobile-friendly booking page. It\'s perfect for getting started. Upgrade anytime to unlock more features.',
  },
  
  // Availability & Scheduling
  {
    category: 'Availability & Scheduling',
    question: 'How do I set my availability?',
    answer: 'Go to "Availability" in your dashboard. You can set your working hours for each day of the week, add buffer time between meetings, and block off specific dates. Your booking page will automatically show only the times you\'re available.',
  },
  {
    category: 'Availability & Scheduling',
    question: 'Can I have different availability for different event types?',
    answer: 'Yes! Each event type can have its own availability settings. For example, you might offer consultations only on Tuesdays and Thursdays, while 15-minute calls are available every weekday. Configure this in each event type\'s settings.',
  },
  {
    category: 'Availability & Scheduling',
    question: 'What happens if someone books during a time I\'m busy?',
    answer: 'BookAgreed automatically blocks times that are already booked, so double-bookings won\'t happen. If you integrate with Google Calendar, we also respect events from your personal calendar.',
  },
  {
    category: 'Availability & Scheduling',
    question: 'How do time zones work?',
    answer: 'BookAgreed automatically detects your guests\' time zones and shows them available times in their local time. This eliminates confusion and scheduling errors across different time zones. You can also set your default time zone in Settings.',
  },
  {
    category: 'Availability & Scheduling',
    question: 'Can I add buffer time between meetings?',
    answer: 'Absolutely! You can set buffer time before and/or after each meeting type. For example, add 15 minutes after each consultation to prepare for the next call. Configure this in each event type\'s advanced settings.',
  },
  
  // Bookings & Management
  {
    category: 'Bookings & Management',
    question: 'How do I view my upcoming bookings?',
    answer: 'Your upcoming bookings are displayed on your Dashboard and in the Calendar view. You can see all booking details, attendee information, and meeting links. The Analytics page also shows booking trends and history.',
  },
  {
    category: 'Bookings & Management',
    question: 'Can guests reschedule or cancel their bookings?',
    answer: 'Yes! Every booking confirmation email includes secure links for rescheduling and cancellation. You can customize how far in advance guests can make changes. This reduces no-shows and gives guests flexibility.',
  },
  {
    category: 'Bookings & Management',
    question: 'How do I cancel a booking?',
    answer: 'You can cancel any booking from your Dashboard or Calendar view. Click on the booking, then select "Cancel". The guest will receive an automatic notification email about the cancellation.',
  },
  {
    category: 'Bookings & Management',
    question: 'What information do I get about each booking?',
    answer: 'For each booking, you\'ll see the guest\'s name, email, the scheduled time (in both your and their time zone), any notes they\'ve added, and the meeting location. Everything you need in one place.',
  },
  
  // Reminders & Notifications
  {
    category: 'Reminders & Notifications',
    question: 'Are email reminders included?',
    answer: 'Yes! Automatic email reminders are included in all plans. Both you and your guests receive booking confirmations, and guests get reminders before the meeting (typically 24 hours and 1 hour before).',
  },
  {
    category: 'Reminders & Notifications',
    question: 'Can I customize reminder emails?',
    answer: 'Pro and Business plan users can customize the timing and content of reminder emails. Go to "Reminders" in your dashboard to configure your preferences.',
  },
  {
    category: 'Reminders & Notifications',
    question: 'How do I reduce no-shows?',
    answer: 'Our automatic reminder system significantly reduces no-shows. You can also enable confirmation requirements, set shorter booking windows, and add buffer time. Many users report a 50%+ reduction in no-shows.',
  },
  
  // Account & Billing
  {
    category: 'Account & Billing',
    question: 'How do I upgrade my plan?',
    answer: 'Go to Settings > Subscription in your dashboard. Choose the plan that fits your needs and follow the checkout process. Your new features will be available immediately after upgrade.',
  },
  {
    category: 'Account & Billing',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel anytime with no questions asked. Go to Settings > Subscription and click "Cancel Subscription". You\'ll keep access to paid features until the end of your billing period, then revert to the free plan.',
  },
  {
    category: 'Account & Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe. All transactions are encrypted and PCI-compliant.',
  },
  {
    category: 'Account & Billing',
    question: 'How do I update my profile information?',
    answer: 'Go to Settings in your dashboard. You can update your name, username, time zone, and notification preferences. Your username determines your booking page URL.',
  },
  {
    category: 'Account & Billing',
    question: 'How do I delete my account?',
    answer: 'If you need to delete your account, please contact our support team at support@bookagreed.com. We\'ll process your request and permanently delete all your data within 30 days, in compliance with data protection regulations.',
  },
  
  // Security & Privacy
  {
    category: 'Security & Privacy',
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption (TLS 1.3) for all data in transit, and your data is stored securely with our trusted cloud providers. We never sell your data to third parties.',
  },
  {
    category: 'Security & Privacy',
    question: 'How do you protect against spam bookings?',
    answer: 'We employ multiple layers of protection including rate limiting, CAPTCHA verification for suspicious activity, disposable email blocking, and sophisticated pattern detection. This keeps your calendar clean and spam-free.',
  },
  {
    category: 'Security & Privacy',
    question: 'Are you GDPR compliant?',
    answer: 'Yes, BookAgreed is fully GDPR compliant. You can request a copy of your data or deletion of your account at any time. We only collect data necessary for the service, and you control how your information is used.',
  },
];

const categories = [...new Set(faqs.map(faq => faq.category))];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push({ ...faq, originalIndex: faqs.indexOf(faq) });
    return acc;
  }, {} as Record<string, (FAQ & { originalIndex: number })[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO {...SEO_CONFIGS.helpCenter} />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src="/BookAgreed%20logo.jpg" alt="BookAgreed" className="h-14" />
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/contact" className="text-gray-700 hover:text-gray-900 font-medium">
              Contact
            </Link>
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
      </nav>

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
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about BookAgreed
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2 rounded-full font-medium transition-all ${
                !activeCategory
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              All Topics
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category === activeCategory ? null : category)}
                className={`px-5 py-2 rounded-full font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedFaqs).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try a different search term or browse all topics.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
                className="mt-4 text-primary-600 font-semibold hover:text-primary-700"
              >
                Clear search
              </button>
            </div>
          ) : (
            Object.entries(groupedFaqs).map(([category, items]) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary-600 rounded-full"></span>
                  {category}
                </h2>
                <div className="space-y-4">
                  {items.map((faq) => (
                    <div
                      key={faq.originalIndex}
                      className="bg-white rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(faq.originalIndex)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        {openItems.includes(faq.originalIndex) ? (
                          <ChevronUpIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {openItems.includes(faq.originalIndex) && (
                        <div className="px-6 pb-5">
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl shadow-xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-lg text-blue-100 mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block bg-white hover:bg-gray-100 text-primary-600 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                📧 Contact Support
              </Link>
              <a
                href="mailto:support@bookagreed.com"
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-white/20"
              >
                support@bookagreed.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#security" className="hover:text-white transition-colors">Security</Link></li>
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
            <p>&copy; 2025 BookAgreed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
