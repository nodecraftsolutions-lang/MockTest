import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
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
  const [animateForm, setAnimateForm] = useState(false);
  const { login, register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setAnimateForm(true);
  }, [isLogin]);

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
          navigate('/student');
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
          if (result.autoLogin) {
            navigate('/student');
          } else {
            setIsLogin(true);
            setFormData({
              name: '',
              email: '',
              mobile: '',
              password: '',
              confirmPassword: ''
            });
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full transition-all duration-500 ease-in-out ${animateForm ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="md:flex">
          {/* Left side - Branding */}
          <div className="md:w-1/2 bg-gray-100 p-8 text-gray-800 flex flex-col justify-center">
            <div className="mb-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">PrepZone</span>
              </Link>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 text-gray-900">
              {isLogin 
                ? 'Welcome Back!' 
                : 'Join PrepZone'}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              {isLogin 
                ? 'Sign in to continue your journey to exam success.'
                : 'Create an account to start acing your exams today.'}
            </p>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Why PrepZone?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">✓</div>
                  <span>Personalized exam preparation</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">✓</div>
                  <span>Performance analytics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">✓</div>
                  <span>Expert-curated questions</span>
                </li>
              </ul>
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
                      onFocus={() => !isLogin && setShowPasswordRequirements(true)}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                </button>

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
    </div>
  );
};

export default Auth;