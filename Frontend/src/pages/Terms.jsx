import { Shield, Clock, User, FileText, CreditCard, Globe, Mail, Phone } from 'lucide-react';

const Terms = () => {
  const lastUpdated = "October 26, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms and Conditions</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Please read these terms and conditions carefully before using Prepzon services
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Prepzon</h2>
                <p className="text-gray-700">
                  These terms and conditions outline the rules and regulations for the use of Prepzon's website and services. 
                  By accessing this website, we assume you accept these terms and conditions. Do not continue to use Prepzon 
                  if you do not agree to all of the terms and conditions stated on this page.
                </p>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">1. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                Unless otherwise stated, Prepzon and/or its licensors own the intellectual property rights for all material on Prepzon. 
                All intellectual property rights are reserved. You may access this from Prepzon for your own personal use subjected to 
                restrictions set in these terms and conditions.
              </p>
              <div className="bg-gray-50 p-6 rounded-xl mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">You must not:</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Republish material from Prepzon</li>
                  <li>Sell, rent or sub-license material from Prepzon</li>
                  <li>Reproduce, duplicate or copy material from Prepzon</li>
                  <li>Redistribute content from Prepzon</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">2. User Accounts</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-4">
                    <User className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Account Registration</h3>
                  </div>
                  <p className="text-gray-700">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                    Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-4">
                    <Shield className="w-6 h-6 text-primary-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Account Security</h3>
                  </div>
                  <p className="text-gray-700">
                    You are responsible for maintaining the confidentiality of your account and password, including but not limited to the 
                    restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities 
                    or actions that occur under your account and/or password.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">3. Course Enrollment and Access</h2>
              <div className="space-y-6">
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Enrollment Process</h3>
                    <p className="text-gray-700">
                      To enroll in a course, you must complete the registration process by providing certain information and paying any 
                      applicable fees. All fees are exclusive of taxes, which will be added to the total amount.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Period</h3>
                    <p className="text-gray-700">
                      Course access is granted for the duration specified at the time of purchase. Access may be extended at Prepzon's 
                      discretion or as per the specific course terms.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Usage</h3>
                    <p className="text-gray-700">
                      All course content is for personal educational purposes only. You may not distribute, modify, transmit, reuse, 
                      download, repost, copy, or use said content for commercial purposes without explicit permission.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">4. Payments and Refunds</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <CreditCard className="w-6 h-6 text-primary-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Payment Terms</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    All payments must be made in full before access to paid content is granted. Prepzon reserves the right to change 
                    pricing at any time, but changes will not affect existing purchases.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Accepted Payment Methods:</h4>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Credit/Debit Cards</li>
                      <li>Net Banking</li>
                      <li>UPI Payments</li>
                      <li>Digital Wallets</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Refund Policy</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Prepzon offers a 7-day money-back guarantee on all course purchases. Refunds are processed within 7-10 business 
                    days after the refund request is approved.
                  </p>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Refund Conditions:</h4>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Course must be requested within 7 days of purchase</li>
                      <li>No more than 20% of course content should be consumed</li>
                      <li>Valid reason for refund must be provided</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">5. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                Prepzon shall not be held liable for any consequential, incidental, indirect, or special damages arising out of your 
                use of the website or services, even if we have been advised of the possibility of such damages.
              </p>
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="w-5 h-5 text-red-600 mr-2" />
                  Specific Limitations:
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Loss of data or profits</li>
                  <li>Business interruption</li>
                  <li>Failure to meet career expectations</li>
                  <li>Job placement guarantees (unless explicitly stated)</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">6. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including 
                without limitation if you breach the Terms.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Upon termination:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Your right to use the service will cease immediately</li>
                    <li>You must cease all use of Prepzon materials</li>
                    <li>Any fees paid are non-refundable unless otherwise stated</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Surviving Provisions:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Intellectual property rights</li>
                    <li>Disclaimer and limitation of liability</li>
                    <li>Termination provisions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">7. Governing Law</h2>
              <div className="flex items-start p-6 bg-blue-50 rounded-xl border border-blue-100">
                <Globe className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 mb-4">
                    These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict 
                    of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver 
                    of those rights.
                  </p>
                  <p className="text-gray-700">
                    If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of 
                    these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">8. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days' notice prior to any new terms taking effect.
              </p>
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What constitutes a material change:</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Changes to pricing structure</li>
                  <li>New limitations on service usage</li>
                  <li>Changes to refund policies</li>
                  <li>Modifications to user obligations</li>
                </ul>
                <p className="mt-4 text-gray-700">
                  By continuing to access or use our service after those revisions become effective, you agree to be bound by the 
                  revised terms. If you do not agree to the new terms, you must stop using the service.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-600 to-blue-800 text-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            If you have any questions about these Terms and Conditions, please contact us
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="mailto:support@prepzon.com" target="_blank" rel="noopener noreferrer" className="flex items-center bg-white text-blue-800 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md">
              <Mail className="w-5 h-5 mr-2" />
              <span>support@prepzon.com</span>
            </a>
            <a href="tel:+918431761279" target="_blank" rel="noopener noreferrer" className="flex items-center bg-white text-blue-800 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md">
              <Phone className="w-5 h-5 mr-2" />
              <span>+91 8431761279</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;