import { Link, useNavigate } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleViewTests = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student mock tests page
      navigate('/student/mock-tests');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/mock-tests');
      navigate('/auth');
    }
  };

  const handleViewCourses = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student courses page
      navigate('/student/courses/');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/courses/');
      navigate('/auth');
    }
  };

  const handleStudyMaterials = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student dashboard
      navigate('/student/all-recordings');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/all-recordings');
      navigate('/auth');
    }
  };

  const handleContact = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student contact page
      navigate('/student/contact');
    } else {
      // If user is not logged in, go to public contact page
      navigate('/contact');
    }
  };

  const footerLinks = {
    products: [
      { name: 'Mock Tests', action: handleViewTests },
      { name: 'Courses', action: handleViewCourses },
      { name: 'Practice Tests', action: handleViewTests },
      { name: 'Study Materials', action: handleStudyMaterials }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' }
    ],
    support: [
      { name: 'Contact Us', action: handleContact },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy-policy' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61582907136736', label: 'Facebook' },
    { icon: Instagram, url: '#', label: 'Instagram' },
    { icon: Linkedin, url: '#', label: 'LinkedIn' },
    { icon: Youtube, url: 'https://youtube.com/@prepzon?si=WSTRcbO5GrwPBmdg', label: 'YouTube' }
  ];

  return (
    <footer className="bg-white text-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/Final Logo.png"
                alt="PrepZon Logo"
                className="h-12 w-auto"
              />
              
            </div>
            <p className="text-black mb-6 max-w-md">
              PrepZon is a next-generation EdTech platform built to bridge the gap between college learning and corporate readiness. We provide a complete suite of Live Interactive Training, Recorded Sessions, and Real-Time Mock Tests covering both Top IT Company Placements and Competitive Exams.

            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                // Determine brand color based on platform
                let brandColor = "text-orange-500 hover:text-orange-600";
                if (social.label === 'Facebook') {
                  brandColor = "text-blue-600 hover:text-blue-700";
                } else if (social.label === 'Instagram') {
                  brandColor = "text-pink-700 hover:text-pink-600";
                } else if (social.label === 'LinkedIn') {
                  brandColor = "text-blue-800 hover:text-blue-800";
                } else if (social.label === 'YouTube') {
                  brandColor = "text-red-600 hover:text-red-700";
                }
                
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${brandColor} transition-colors`}
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-500">Products</h3>
            <ul className="space-y-2">
              {footerLinks.products.map((item, index) => (
                <li key={index}>
                  {item.action ? (
                    <button 
                      onClick={item.action}
                      className="text-blue-800 hover:text-blue-600 transition-colors text-left w-full"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link 
                      to={item.path} 
                      className="text-blue-800 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-500">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((item, index) => (
                <li key={index}>
                  {item.action ? (
                    <button 
                      onClick={item.action}
                      className="text-blue-800 hover:text-blue-600 transition-colors text-left w-full"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link 
                      to={item.path} 
                      className="text-blue-800 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-500">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((item, index) => (
                <li key={index}>
                  {item.action ? (
                    <button 
                      onClick={item.action}
                      className="text-blue-800 hover:text-blue-600 transition-colors text-left w-full"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link 
                      to={item.path} 
                      className="text-blue-800 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-orange-500 mr-3" />
              <a href="mailto:support@prepzon.com" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-600 transition-colors">
                support@prepzon.com
              </a>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-orange-500 mr-3" />
              <a href="tel:+918431761279" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-600 transition-colors">
                +91 8431761279
              </a>
            </div>
            <div className="flex items-center">
              <MapPin className="w-7 h-7 text-orange-500 mr-3" />
              <span className="text-black">Prepzon EdTech, B-Block, Silver Springs Layout, Marathahalli, Munnekolala, Bangalore, Karnataka, India, 560037</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-black">
          <p>&copy; {currentYear} PrepZon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;