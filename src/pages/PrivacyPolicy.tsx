import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center">
            <img 
              src="/BookAgreed%20logo.jpg" 
              alt="BookAgreed" 
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 29, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to BookGrid ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our scheduling service.
            </p>
            <p className="text-gray-700">
              By using BookGrid, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Profile information (bio, profile picture, time zone)</li>
              <li>Calendar and scheduling preferences</li>
              <li>Payment information (processed securely through third-party payment processors)</li>
              <li>Communication preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-4">When you use our service, we automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Log data (access times, error logs)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-gray-700 mb-4">
              We may receive information from third-party services you connect to BookGrid, such as calendar integrations (Google Calendar, Outlook) and video conferencing platforms (Zoom, Google Meet).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our scheduling services</li>
              <li>Process and complete transactions</li>
              <li>Send you booking confirmations, reminders, and updates</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Send you technical notices, updates, security alerts, and support messages</li>
              <li>Communicate with you about products, services, offers, and promotions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 With Your Consent</h3>
            <p className="text-gray-700 mb-4">
              We share your information when you give us permission to do so, such as when you connect third-party services or share your booking link.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We share information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Cloud hosting providers (Supabase)</li>
              <li>Email service providers</li>
              <li>Payment processors</li>
              <li>Analytics providers</li>
              <li>Customer support tools</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication</li>
              <li>Secure backup and disaster recovery procedures</li>
            </ul>
            <p className="text-gray-700">
              However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us at privacy@bookgrid.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> legal@bookgrid.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2025 BookGrid. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
