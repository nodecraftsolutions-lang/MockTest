import { Link } from 'react-router-dom';
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

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    products: [
      { name: 'Mock Tests', path: '/mock-tests' },
      { name: 'Courses', path: '/courses' },
      { name: 'Practice Tests', path: '/practice' },
      { name: 'Study Materials', path: '/materials' }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Contact', path: '/contact' },
      { name: 'Blog', path: '/blog' }
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'FAQ', path: '/faq' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, url: '#', label: 'Facebook' },
    { icon: Twitter, url: '#', label: 'Twitter' },
    { icon: Instagram, url: '#', label: 'Instagram' },
    { icon: Linkedin, url: '#', label: 'LinkedIn' },
    { icon: Youtube, url: '#', label: 'YouTube' }
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/Final Logo.png"
                alt="MockTest Pro Logo"
                className="h-10 w-auto"
              />
              
            </div>
            <p className="text-secondary-200 mb-6 max-w-md">
              Prepare for your dream job with our comprehensive mock test platform. 
              Practice with real exam patterns from top companies and track your progress.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-200 hover:text-white transition-colors"
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
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              {footerLinks.products.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="text-secondary-200 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="text-secondary-200 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="text-secondary-200 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-secondary-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-secondary-200 mr-3" />
              <span className="text-secondary-200">support@mocktestpro.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-secondary-200 mr-3" />
              <span className="text-secondary-200">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-secondary-200 mr-3" />
              <span className="text-secondary-200">123 Education St, Learning City, LC 12345</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-200">
          <p>&copy; {currentYear} PrepZon All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;