import { Link } from 'react-router-dom';

export function About() {
  const team = [
    {
      name: 'Alex Thompson',
      role: 'Founder & CEO',
      emoji: '👨‍💼',
      bio: 'Former tech lead at a Fortune 500 company. Passionate about simplifying workflows.',
    },
    {
      name: 'Sarah Chen',
      role: 'Head of Product',
      emoji: '👩‍💻',
      bio: 'Product designer with 10+ years of experience in SaaS tools.',
    },
    {
      name: 'Michael Rivera',
      role: 'Lead Engineer',
      emoji: '👨‍🔧',
      bio: 'Full-stack developer focused on building scalable, secure systems.',
    },
    {
      name: 'Emily Watson',
      role: 'Customer Success',
      emoji: '👩‍🏫',
      bio: 'Dedicated to ensuring every user has a fantastic experience.',
    },
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Simplicity First',
      description: 'We believe powerful tools don\'t need to be complicated. Every feature is designed to be intuitive.',
    },
    {
      icon: '🔒',
      title: 'Privacy Matters',
      description: 'Your data is yours. We never sell it, and we use industry-best practices to keep it secure.',
    },
    {
      icon: '🌍',
      title: 'Global by Design',
      description: 'Built for users worldwide with proper time zone support and accessible design.',
    },
    {
      icon: '💚',
      title: 'Customer Obsessed',
      description: 'Every decision we make starts with: "How does this help our users?"',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src="/BookAgreed%20logo.jpg" alt="BookAgreed" className="h-14" />
          </Link>
          <div className="flex items-center space-x-4">
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            About BookAgreed
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're on a mission to eliminate the back-and-forth of scheduling. 
            Founded in 2024, BookAgreed helps thousands of professionals save time 
            and focus on what matters most.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  BookAgreed was born from a simple frustration: the endless email chains 
                  just to schedule a single meeting. "When are you free?" "How about Tuesday?" 
                  "Actually, can we do Wednesday instead?"
                </p>
                <p>
                  We knew there had to be a better way. So we built BookAgreed—a scheduling 
                  tool that's powerful enough for busy professionals yet simple enough that 
                  anyone can use it in minutes.
                </p>
                <p>
                  Today, we serve users across the globe, from solo consultants to growing 
                  teams. And we're just getting started.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">📅</div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl font-bold text-primary-600">10K+</div>
                  <div className="text-gray-600">Happy Users</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600">50K+</div>
                  <div className="text-gray-600">Meetings Scheduled</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600">100+</div>
                  <div className="text-gray-600">Countries</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-xl text-gray-600">The people behind BookAgreed</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all border border-gray-100">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl shadow-xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
            <p className="text-lg text-blue-100 mb-8">
              Start scheduling smarter today. It's free to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-block bg-white hover:bg-gray-100 text-primary-600 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/contact"
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-white/20"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
