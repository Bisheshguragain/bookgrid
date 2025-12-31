import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function TermsOfService() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: December 29, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to BookGrid. By accessing or using our scheduling service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-gray-700">
              These Terms apply to all visitors, users, and others who access or use the Service. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              BookGrid provides an online scheduling platform that allows users to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Create and manage event types</li>
              <li>Set availability preferences and working hours</li>
              <li>Share booking links with clients and prospects</li>
              <li>Receive and manage bookings</li>
              <li>Send automated reminders and notifications</li>
              <li>Integrate with third-party calendar and video conferencing services</li>
              <li>Access analytics and insights</li>
            </ul>
            <p className="text-gray-700">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Not share your account with others</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Eligibility</h3>
            <p className="text-gray-700">
              You must be at least 13 years old to use the Service. By using the Service, you represent and warrant that you meet this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Plans and Payments</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Plans</h3>
            <p className="text-gray-700 mb-4">
              BookGrid offers various subscription plans, including free and paid tiers. Current pricing and plan details are available on our website.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Billing</h3>
            <p className="text-gray-700 mb-4">
              For paid plans:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>Prices may change with 30 days' notice</li>
              <li>Failure to pay may result in service suspension or termination</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Cancellation</h3>
            <p className="text-gray-700">
              You may cancel your subscription at any time. Cancellation will be effective at the end of the current billing period. No refunds will be provided for partial months or unused features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Conduct</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Violate the rights of others, including intellectual property rights</li>
              <li>Send spam, unsolicited communications, or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) without our permission</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest user information without consent</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of any content you submit, post, or display through the Service ("Your Content"). By submitting Your Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display Your Content solely to provide the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Our Content</h3>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by BookGrid and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Trademarks</h3>
            <p className="text-gray-700">
              BookGrid, our logo, and other marks are trademarks of BookGrid, Inc. You may not use these marks without our prior written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              The Service may contain links to or integrate with third-party services (e.g., Google Calendar, Zoom, Stripe). We are not responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>The content, accuracy, or availability of third-party services</li>
              <li>The privacy practices of third-party services</li>
              <li>Any transactions between you and third-party services</li>
            </ul>
            <p className="text-gray-700">
              Your use of third-party services is governed by their respective terms and privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the Service, you agree to our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Service "As Is"</h3>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 No Guarantee</h3>
            <p className="text-gray-700 mb-4">
              We do not guarantee that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>Results obtained from the Service will be accurate or reliable</li>
              <li>Defects will be corrected</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Limitation of Liability</h3>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOOKGRID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify, defend, and hold harmless BookGrid and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>At your request</li>
            </ul>
            <p className="text-gray-700">
              Upon termination, your right to use the Service will immediately cease. We may delete your account and all associated data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Arbitration</h3>
            <p className="text-gray-700">
              Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in court.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms constitute the entire agreement between you and BookGrid regarding the Service and supersede all prior agreements.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.3 Waiver</h3>
            <p className="text-gray-700 mb-4">
              No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.4 Assignment</h3>
            <p className="text-gray-700">
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
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
