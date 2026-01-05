import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO, SEO_CONFIGS } from '../components/SEO';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How to Reduce No-Shows by 50% with Smart Reminders',
    excerpt: 'Discover proven strategies to dramatically reduce no-shows and keep your calendar running smoothly with automated reminders.',
    category: 'Tips & Tricks',
    date: 'Jan 15, 2025',
    readTime: '5 min read',
    image: '📧',
  },
  {
    id: '2',
    title: 'The Complete Guide to Setting Up Your Booking Page',
    excerpt: 'Learn how to create a professional booking page that converts visitors into scheduled meetings.',
    category: 'Getting Started',
    date: 'Jan 10, 2025',
    readTime: '8 min read',
    image: '📖',
  },
  {
    id: '3',
    title: 'Time Zone Management: Best Practices for Global Teams',
    excerpt: 'Managing meetings across multiple time zones? Here\'s how to avoid confusion and schedule with confidence.',
    category: 'Productivity',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
    image: '🌍',
  },
  {
    id: '4',
    title: '10 Ways to Optimize Your Availability Schedule',
    excerpt: 'Make the most of your working hours with these expert tips for configuring your availability.',
    category: 'Tips & Tricks',
    date: 'Dec 28, 2024',
    readTime: '7 min read',
    image: '⏰',
  },
  {
    id: '5',
    title: 'Why Buffer Time Between Meetings Matters',
    excerpt: 'Back-to-back meetings can drain your energy. Learn why buffer time is essential for productivity.',
    category: 'Productivity',
    date: 'Dec 20, 2024',
    readTime: '4 min read',
    image: '☕',
  },
  {
    id: '6',
    title: 'Building Client Trust Through Professional Scheduling',
    excerpt: 'First impressions matter. See how a polished booking experience can strengthen client relationships.',
    category: 'Business',
    date: 'Dec 15, 2024',
    readTime: '5 min read',
    image: '🤝',
  },
];

export const categories = ['All', 'Getting Started', 'Tips & Tricks', 'Productivity', 'Business'];

export function Blog() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO {...SEO_CONFIGS.blog} />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src="/BookAgreed%20logo.jpg" alt="BookAgreed" className="h-14" />
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/help" className="text-gray-700 hover:text-gray-900 font-medium">
              Help Center
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
            BookAgreed Blogs
          </h1>
          <p className="text-xl text-gray-600">
            Tips, guides, and insights to help you schedule smarter
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <button
                key={category}
                className={`px-5 py-2 rounded-full font-medium transition-all ${
                  category === 'All'
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

      {/* Featured Post */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12 text-white">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                Featured Post
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                The Future of Scheduling: AI-Powered Meeting Management
              </h2>
              <p className="text-lg text-blue-100 mb-6 max-w-2xl">
                Discover how artificial intelligence is revolutionizing the way we schedule meetings, 
                from smart suggestions to automatic rescheduling.
              </p>
              <div className="flex items-center gap-4 text-blue-100 mb-6">
                <span>Jan 20, 2025</span>
                <span>•</span>
                <span>10 min read</span>
              </div>
              <button className="bg-white hover:bg-gray-100 text-primary-600 px-6 py-3 rounded-lg font-semibold transition-colors">
                Read Article →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-5xl">{post.image}</span>
                    <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border-2 border-purple-100">
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay in the Loop</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                Get the latest scheduling tips, product updates, and productivity insights delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-sm text-gray-500 mt-4">No spam, unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
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
