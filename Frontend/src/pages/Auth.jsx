import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle, Users, Video, MessageCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [redirectMessage, setRedirectMessage] = useState('');
  const { login, register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to update message based on redirect URL
  const updateRedirectMessage = () => {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    // Check if the user came directly from the navbar
    const cameFromNavbar = location.search.includes('source=navbar');
    
    if (redirectUrl && !cameFromNavbar) {
      // Set message based on the redirect URL
      if (redirectUrl.includes('/student/courses/')) {
        setRedirectMessage('Unlock your learning journey—sign up or log in to PREPZON and explore our live courses now!');
      } else if (redirectUrl.includes('/student/all-recordings')) {
        setRedirectMessage('Access recorded sessions anytime—just sign up or log in to PREPZON.');
      } else if (redirectUrl.includes('/student/mock-tests')) {
        setRedirectMessage('Sign up or log in to PREPZON to test your skills with our mock exams—designed to match real company patterns and boost your confidence.');
      } else {
        // Generic message for other redirects
        setRedirectMessage('Sign in to continue to your destination.');
      }
    } else {
      setRedirectMessage('');
    }
  };

  // Check for redirect message when component mounts
  useEffect(() => {
    updateRedirectMessage();
    
    // Listen for storage changes (works for other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'redirectAfterLogin') {
        updateRedirectMessage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes in the same tab (every 500ms)
    const interval = setInterval(() => {
      updateRedirectMessage();
    }, 500);
    
    // Cleanup listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [location.search]); // Add location.search to dependencies

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Mobile number must be 10 digits';
      }
      
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = ['Password is required'];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Function to send welcome email
  const sendWelcomeEmail = async (name, email) => {
    try {
      const response = await fetch('https://prep-zone-mailserver.vercel.app/api/mail/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email
        })
      });
      
      if (!response.ok) {
        console.error('Failed to send welcome email');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login({ 
          email: formData.email, 
          password: formData.password 
        });
        
        if (result.success) {
          showSuccess('Login successful!');
          // Clear the redirect message
          setRedirectMessage('');
          // Check if there's a redirect URL stored in localStorage
          const redirectUrl = localStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            // Remove the redirect URL from localStorage
            localStorage.removeItem('redirectAfterLogin');
            // Redirect to the stored URL
            setTimeout(() => navigate(redirectUrl), 1000);
          } else {
            // Redirect based on user role
            const userRole = result.data?.student?.role || 'student'; // Default to student if role not specified
            setTimeout(() => navigate(userRole === 'admin' ? '/admin' : '/student'), 1000);
          }
        } else {
          showError(result.message || 'Login failed');
        }
      } else {
        const result = await register({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });

        if (result.success) {
          showSuccess('Registration successful!');
          // Clear the redirect message
          setRedirectMessage('');
          if (result.autoLogin) {
            // Check if there's a redirect URL stored in localStorage
            const redirectUrl = localStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
              // Remove the redirect URL from localStorage
              localStorage.removeItem('redirectAfterLogin');
              // Redirect to the stored URL
              setTimeout(() => navigate(redirectUrl), 1000);
            } else {
              // Redirect based on user role
              const userRole = result.data?.student?.role || 'student'; // Default to student if role not specified
              setTimeout(() => navigate(userRole === 'admin' ? '/admin' : '/student'), 1000);
            }
          } else {
            setTimeout(() => {
              setIsLogin(true);
              setFormData({
                name: '',
                email: '',
                mobile: '',
                password: '',
                confirmPassword: ''
              });
            }, 1000);
          }
        } else {
          showError(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      showError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setShowPasswordRequirements(false);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: ''
    });
  };

  // Features data
  const features = [
    {
      icon: <Video className="w-5 h-5 text-trinidad-500" />,
      title: "Live Sessions",
      description: "Interactive live classes with expert instructors"
    },
    {
      icon: <BookOpen className="w-5 h-5 text-trinidad-500" />,
      title: "Recordings & Study Materials",
      description: "Access recorded sessions and comprehensive study materials"
    },
    {
      icon: <Users className="w-5 h-5 text-trinidad-500" />,
      title: "Industry Experts",
      description: "Learn from professionals with real-world experience"
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-trinidad-500" />,
      title: "Live Mentor Support",
      description: "Get help through forums and live mentor sessions"
    }
  ];

  return (
    <div className="min-h-screen bg-spring-wood flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/Final.png" 
              alt="PrepZone Logo" 
              className="h-12 w-auto"
            />
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleAuthMode}
                className="ml-1 font-medium text-trinidad-500 hover:text-trinidad-600 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
          
          {/* Display redirect message */}
          {redirectMessage && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    {redirectMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-trinidad-500 focus:border-trinidad-500'} shadow-sm transition-all text-foreground`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-trinidad-500 focus:border-trinidad-500'} shadow-sm transition-all text-foreground`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="mobile" className="block text-sm font-medium text-foreground">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border ${errors.mobile ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-trinidad-500 focus:border-trinidad-500'} shadow-sm transition-all text-foreground`}
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>
                {errors.mobile && <p className="text-sm text-red-600">{errors.mobile}</p>}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => {!isLogin && setShowPasswordRequirements(true);}}
                  onBlur={() => {!isLogin && setShowPasswordRequirements(false);}}
                  className={`block w-full pl-9 pr-9 py-2.5 rounded-lg border ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-trinidad-500 focus:border-trinidad-500'} shadow-sm transition-all text-foreground`}
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && Array.isArray(errors.password) ? (
                <div className="mt-1">
                  {errors.password.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {error}
                    </p>
                  ))}
                </div>
              ) : errors.password ? (
                <p className="text-xs text-red-600">{errors.password}</p>
              ) : null}
              
              {!isLogin && showPasswordRequirements && !errors.password && (
                <div className="mt-2 p-2 bg-trinidad-50 border border-trinidad-100 rounded-md">
                  <p className="text-xs font-medium text-trinidad-800 mb-1">Password requirements:</p>
                  <ul className="text-xs text-trinidad-700 space-y-1">
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 mr-1 mt-0.5">•</span>
                      6+ characters
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 mr-1 mt-0.5">•</span>
                      Upper & lowercase
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 mr-1 mt-0.5">•</span>
                      At least one number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border ${errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-trinidad-500 focus:border-trinidad-500'} shadow-sm transition-all text-foreground`}
                    placeholder="Re-enter password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-trinidad-500 focus:ring-trinidad-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-trinidad-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trinidad-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>

            {!isLogin && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-blue-500 hover:underline">Terms</a>{' '}
                and{' '}
                <a href="/privacy-policy" className="text-blue-500 hover:underline">Privacy Policy</a>
              </p>
            )}
          </form>
        </div>
        
        {/* Features Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground text-center mb-4">Why PrepZone?</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start mb-2">
                  <div className="mr-2 mt-0.5">
                    {feature.icon}
                  </div>
                  <h4 className="font-medium text-foreground text-sm">{feature.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        
      </div>
    </div>
  );
};

export default Auth;