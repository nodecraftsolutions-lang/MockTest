import { Shield, User, CreditCard, Database, Cookie, Mail, Phone, MapPin } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "October 26, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <div className="mt-4 text-primary-200">
              Last Updated: {lastUpdated}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <div className="flex items-start mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <Shield className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Introduction</h2>
                <p className="text-gray-700">
                  PrepZon ("we", "our", "us") respects your privacy and is committed to protecting your personal data. 
                  This Privacy Policy outlines how we collect, use, and protect the personal information of students, tutors, 
                  and users who interact with our platform.
                </p>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">1. Information We Collect</h2>
              <div className="space-y-6">
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Details</h3>
                    <p className="text-gray-700">
                      Name, email address, mobile number, and academic details during registration.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Information</h3>
                    <p className="text-gray-700">
                      Payment details for course or test purchases (processed securely through third-party payment gateways).
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Usage Data</h3>
                    <p className="text-gray-700">
                      Login information, time spent on courses, and interaction with mock tests.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-6">
                We use your data to:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 text-orange-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Service Provision</h3>
                  </div>
                  <p className="text-gray-700">
                    Provide access to courses, live sessions, and mock tests.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Communication</h3>
                  </div>
                  <p className="text-gray-700">
                    Send class schedules, updates, and notifications.
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 text-orange-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Service Improvement</h3>
                  </div>
                  <p className="text-gray-700">
                    Improve our services through feedback and analytics.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Important Information</h3>
                  </div>
                  <p className="text-gray-700">
                    Communicate important information such as payment confirmations and announcements.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">3. Data Sharing</h2>
              <div className="flex items-start p-6 bg-blue-50 rounded-xl border border-blue-100">
                <Shield className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 mb-4">
                    We do not sell or rent your personal data to third parties. However, your data may be shared with 
                    trusted partners, such as payment gateways, email service providers, or hosting platforms, strictly 
                    for service delivery purposes.
                  </p>
                  <div className="bg-white p-4 rounded-lg mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Third-party Services:</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Payment processors for transaction handling</li>
                      <li>Email service providers for communication</li>
                      <li>Analytics services for platform improvement</li>
                      <li>Cloud hosting providers for data storage</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">4. Data Retention and Security</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <Database className="w-6 h-6 text-primary-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Data Retention</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    We retain user data only for as long as necessary to provide services and comply with legal obligations.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Retention Periods:</h4>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Active user data: While account is active</li>
                      <li>Inactive user data: Up to 2 years after inactivity</li>
                      <li>Transaction records: 7 years for legal compliance</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-4">
                    <Shield className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Data Security</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    All user information is stored securely using encryption and access control measures.
                  </p>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Security Measures:</h4>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>End-to-end encryption for sensitive data</li>
                      <li>Regular security audits and assessments</li>
                      <li>Multi-factor authentication options</li>
                      <li>Secure server infrastructure</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">5. Cookies</h2>
              <div className="flex items-start p-6 bg-orange-50 rounded-xl border border-orange-100">
                <Cookie className="w-8 h-8 text-orange-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 mb-4">
                    Our website uses cookies to enhance user experience, track usage patterns, and improve site performance. 
                    Users may disable cookies in their browser settings, but some features may not function properly as a result.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies:</h3>
                      <ul className="list-disc pl-6 text-gray-700">
                        <li>Authentication tokens</li>
                        <li>Session management</li>
                        <li>Security preferences</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies:</h3>
                      <ul className="list-disc pl-6 text-gray-700">
                        <li>Performance tracking</li>
                        <li>User behavior analysis</li>
                        <li>Feature usage metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">6. User Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to access, correct, or request deletion of your personal data. 
                Requests can be submitted by email to contact@prepzon.com.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights Include:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Right to access your personal data</li>
                    <li>Right to rectify inaccurate information</li>
                    <li>Right to erasure (right to be forgotten)</li>
                    <li>Right to data portability</li>
                    <li>Right to object to processing</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Exercise Rights:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Email: contact@prepzon.com</li>
                    <li>Phone: +91 98765 43210</li>
                    <li>Response time: Within 30 days</li>
                    <li>Verification may be required</li>
                    <li>Free of charge for most requests</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">7. Updates to Privacy Policy</h2>
              <div className="flex items-start p-6 bg-blue-50 rounded-xl border border-blue-100">
                <Database className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 mb-4">
                    PrepZon may update this Privacy Policy periodically. The latest version will always be available on our website. 
                    Users are encouraged to review this page regularly for any changes.
                  </p>
                  <div className="bg-white p-4 rounded-lg mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Notification of Changes:</h3>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Significant changes will be emailed to users</li>
                      <li>Updates posted 30 days before effective date</li>
                      <li>Continued use indicates acceptance of changes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For any privacy-related concerns or questions, please contact:
              </p>
              <div className="bg-gradient-to-br from-primary-600 to-blue-800 text-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">PrepZon</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>MSME Registered Startup Company, Bangalore, India</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3" />
                    <a href="mailto:support@prepzon.com" className="hover:text-primary-200 transition-colors">
                      support@prepzon.com
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" />
                    <a href="tel:+918431761279" className="hover:text-primary-200 transition-colors">
                      +91 8431761279
                    </a>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-primary-500">
                  <p className="text-primary-100">
                    🌐 www.prepzon.com
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <a href="mailto:support@prepzon.com" target="_blank" rel="noopener noreferrer" className="flex items-center bg-white text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>Email Us</span>
                  </a>
                  <a href="tel:+918431761279" target="_blank" rel="noopener noreferrer" className="flex items-center bg-white text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>Call Us</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;