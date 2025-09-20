import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isPublic />
      <main>
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MockTest Pro</h3>
              <p className="text-gray-600 text-sm">
                Prepare for your dream job with our comprehensive mock test platform. 
                Practice with real exam patterns from top companies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/mock-tests" className="hover:text-primary-600">Mock Tests</a></li>
                <li><a href="/about" className="hover:text-primary-600">About Us</a></li>
                <li><a href="/contact" className="hover:text-primary-600">Contact</a></li>
                <li><a href="/privacy" className="hover:text-primary-600">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: support@mocktestpro.com</li>
                <li>Phone: +91 12345 67890</li>
                <li>Mon-Fri: 9AM - 6PM IST</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2025 MockTest Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;