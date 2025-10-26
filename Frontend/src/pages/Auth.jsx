import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [animateForm, setAnimateForm] = useState(false);
  const [characterState, setCharacterState] = useState('idle');
  const [focusedField, setFocusedField] = useState(null);
  const { login, register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setAnimateForm(true);
  }, [isLogin]);

  useEffect(() => {
    // Set character state based on form state
    if (loading) {
      setCharacterState('loading');
    } else if (Object.keys(errors).length > 0) {
      setCharacterState('error');
    } else if (focusedField === 'password') {
      setCharacterState('password');
    } else if (focusedField) {
      setCharacterState('typing');
    } else {
      setCharacterState(isLogin ? 'welcomeBack' : 'newUser');
    }
  }, [loading, errors, focusedField, isLogin]);

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
          setCharacterState('success');
          showSuccess('Login successful!');
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
          setCharacterState('error');
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
          setCharacterState('success');
          showSuccess('Registration successful!');
          
          // Send welcome email
          await sendWelcomeEmail(formData.name, formData.email);
          
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
          setCharacterState('error');
          showError(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setCharacterState('error');
      showError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAnimateForm(false);
    setTimeout(() => {
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
    }, 200);
  };

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  // Animation variants for the character
  const characterVariants = {
    idle: { 
      scale: 1,
      rotate: [0, 0, 0],
      transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
    },
    welcomeBack: { 
      scale: [1, 1.05, 1],
      rotate: [0, 5, 0],
      transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
    },
    newUser: { 
      scale: [1, 1.05, 1],
      rotate: [0, -5, 0],
      transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
    },
    typing: { 
      y: [0, -10, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
    },
    password: { 
      scale: [1, 1.1, 1],
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.5 }
    },
    loading: { 
      rotate: [0, 360],
      transition: { duration: 1, repeat: Infinity, ease: "linear" }
    },
    error: { 
      x: [0, 10, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    },
    success: { 
      scale: [1, 1.2, 1],
      rotate: [0, 360, 720],
      transition: { duration: 1 }
    }
  };

  // Character expressions based on state
  const renderCharacterFace = () => {
    switch(characterState) {
      case 'error':
        return (
          <div className="character-face">
            <div className="eyes">
              <div className="eye eye-left">✖</div>
              <div className="eye eye-right">✖</div>
            </div>
            <div className="mouth sad">︵</div>
          </div>
        );
      case 'success':
        return (
          <div className="character-face">
            <div className="eyes">
              <div className="eye eye-left">^</div>
              <div className="eye eye-right">^</div>
            </div>
            <div className="mouth happy">⌣</div>
          </div>
        );
      case 'password':
        return (
          <div className="character-face">
            <div className="eyes">
              <div className="eye eye-left">👁️</div>
              <div className="eye eye-right">👁️</div>
            </div>
            <div className="mouth curious">o</div>
          </div>
        );
      case 'loading':
        return (
          <div className="character-face">
            <div className="eyes">
              <div className="eye eye-left spinning">@</div>
              <div className="eye eye-right spinning">@</div>
            </div>
            <div className="mouth">○</div>
          </div>
        );
      default:
        return (
          <div className="character-face">
            <div className="eyes">
              <div className="eye eye-left">•</div>
              <div className="eye eye-right">•</div>
            </div>
            <div className="mouth">{characterState === 'welcomeBack' ? '◡' : '◠'}</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full transition-all duration-500 ease-in-out ${animateForm ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="md:flex">
          {/* Left side - Animated Character */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col items-center justify-center">
            <div className="mb-6">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">PrepZone</span>
              </Link>
            </div>
            
            <div className="w-full flex flex-col items-center justify-center">
              <motion.div 
                className="character-container"
                variants={characterVariants}
                animate={characterState}
                initial="idle"
              >
                {/* Character Body */}
                <div className="character-body relative w-64 h-64 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  {/* Character Face */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-5xl">
                      {renderCharacterFace()}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Speech Bubble */}
              <motion.div 
                className="speech-bubble bg-white p-4 rounded-xl mt-6 shadow-md relative text-center max-w-xs"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                <p className="text-gray-800 font-medium">
                  {characterState === 'idle' && "Hey there! I'm Prepper, your study buddy!"}
                  {characterState === 'welcomeBack' && "Welcome back! Ready to ace those exams?"}
                  {characterState === 'newUser' && "Nice to meet you! Let's get you registered!"}
                  {characterState === 'typing' && "Tell me more about yourself!"}
                  {characterState === 'password' && "Shhh! Make sure it's a strong password!"}
                  {characterState === 'loading' && "Working on it... Just a moment!"}
                  {characterState === 'error' && "Oops! Something's not right. Let's fix it!"}
                  {characterState === 'success' && "Awesome! You're all set!"}
                  {focusedField === 'email' && "What's your email address?"}
                  {focusedField === 'name' && "What should I call you?"}
                  {focusedField === 'mobile' && "How can we reach you?"}
                  {focusedField === 'confirmPassword' && "Just making sure you got it right!"}
                </p>
              </motion.div>
              
              <div className="mt-8 text-center">
                <h3 className="text-lg font-semibold mb-2">PrepZone Features</h3>
                <div className="flex justify-center space-x-4 mt-4">
                  <motion.div 
                    className="feature-icon bg-primary-100 p-3 rounded-full"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span role="img" aria-label="Personalized" className="text-2xl">📊</span>
                  </motion.div>
                  <motion.div 
                    className="feature-icon bg-primary-100 p-3 rounded-full"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <span role="img" aria-label="Analytics" className="text-2xl">📈</span>
                  </motion.div>
                  <motion.div 
                    className="feature-icon bg-primary-100 p-3 rounded-full"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span role="img" aria-label="Questions" className="text-2xl">📝</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="md:w-1/2 p-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={toggleAuthMode}
                    className="ml-2 font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    {isLogin ? 'Sign up now' : 'Sign in'}
                  </button>
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('name')}
                        onBlur={handleFieldBlur}
                        className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'} shadow-sm transition-all`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFieldFocus('email')}
                      onBlur={handleFieldBlur}
                      className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'} shadow-sm transition-all`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('mobile')}
                        onBlur={handleFieldBlur}
                        className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.mobile ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'} shadow-sm transition-all`}
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
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => {
                        handleFieldFocus('password');
                        !isLogin && setShowPasswordRequirements(true);
                      }}
                      onBlur={handleFieldBlur}
                      className={`block w-full pl-10 pr-10 py-3 rounded-lg border ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'} shadow-sm transition-all`}
                      placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && Array.isArray(errors.password) ? (
                    <div className="mt-2">
                      {errors.password.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {error}
                        </p>
                      ))}
                    </div>
                  ) : errors.password ? (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  ) : null}
                  
                  {!isLogin && showPasswordRequirements && !errors.password && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-1">Password requirements:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-start">
                          <span className="inline-block w-4 h-4 mr-1 mt-0.5">•</span>
                          At least 6 characters long
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-4 h-4 mr-1 mt-0.5">•</span>
                          At least one uppercase letter (A-Z)
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-4 h-4 mr-1 mt-0.5">•</span>
                          At least one lowercase letter (a-z)
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-4 h-4 mr-1 mt-0.5">•</span>
                          At least one number (0-9)
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('confirmPassword')}
                        onBlur={handleFieldBlur}
                        className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'} shadow-sm transition-all`}
                        placeholder="Re-enter your password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
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
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {!isLogin && (
                  <p className="text-xs text-gray-500 text-center mt-4">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for character styling */}
      <style jsx>{`
        .character-face {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .eyes {
          display: flex;
          gap: 20px;
          font-size: 24px;
        }
        
        .mouth {
          font-size: 30px;
          line-height: 1;
        }
        
        .mouth.sad {
          transform: rotate(180deg);
        }
        
        .spinning {
          display: inline-block;
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Auth;