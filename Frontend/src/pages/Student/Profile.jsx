import { useState, useEffect } from 'react';
import { Save, Lock, User, Mail, Phone, Settings, Camera, Bell, Moon, Sun, ChevronRight, Shield, LogOut, Edit } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    preferences: {
      notifications: { email: true, sms: false },
      theme: 'light'
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const { showError, showSuccess } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/students/profile');
      if (response.data.success) {
        const profileData = response.data.data.student;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          mobile: profileData.mobile || '',
          preferences: profileData.preferences || {
            notifications: { email: true, sms: false },
            theme: 'light'
          }
        });
      }
    } catch (error) {
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      // Simple password strength checker
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[a-z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      
      setPasswordStrength(strength);
      
      if (strength < 2) setPasswordFeedback('Weak password');
      else if (strength < 4) setPasswordFeedback('Moderate password');
      else setPasswordFeedback('Strong password');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/students/profile', formData);
      if (response.data.success) {
        showSuccess('Profile updated successfully');
        setProfile(response.data.data.student);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const response = await api.post('/students/change-password', passwordData);
      if (response.data.success) {
        showSuccess('Password changed successfully. Please login again.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header with profile summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="relative group mb-4 md:mb-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
              {getInitials(profile?.name)}
            </div>
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer group-hover:bg-primary-50 transition-colors">
              <Camera className="w-4 h-4 text-primary-600" />
            </div>
          </div>
          
          <div className="md:ml-6 flex-grow">
            <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mt-1 space-y-1 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>{profile?.email}</span>
              </div>
              {profile?.mobile && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1.5 text-gray-500" />
                  <span>{profile?.mobile}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Member since {new Date(profile?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setActiveTab('profile')}
              className="btn-outline-primary flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main content with sidebar navigation */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <nav className="flex flex-col">
              <SidebarNavItem 
                icon={<User className="w-5 h-5" />} 
                label="Personal Information" 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
              />
              <SidebarNavItem 
                icon={<Shield className="w-5 h-5" />} 
                label="Security" 
                active={activeTab === 'security'} 
                onClick={() => setActiveTab('security')} 
              />
              <SidebarNavItem 
                icon={<Bell className="w-5 h-5" />} 
                label="Notifications" 
                active={activeTab === 'notifications'} 
                onClick={() => setActiveTab('notifications')} 
              />
              <SidebarNavItem 
                icon={formData.preferences.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} 
                label="Appearance" 
                active={activeTab === 'appearance'} 
                onClick={() => setActiveTab('appearance')} 
              />
              <div className="border-t border-gray-200 mt-2 pt-2">
                <SidebarNavItem 
                  icon={<LogOut className="w-5 h-5" />} 
                  label="Logout" 
                  onClick={logout} 
                  className="text-red-600 hover:bg-red-50"
                />
              </div>
            </nav>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-grow">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <ProfileForm formData={formData} handleInputChange={handleInputChange} saving={saving} />
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <PasswordForm 
                    passwordData={passwordData} 
                    handlePasswordChange={handlePasswordChange} 
                    saving={saving} 
                    passwordStrength={passwordStrength}
                    passwordFeedback={passwordFeedback}
                  />
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <NotificationsForm formData={formData} handleInputChange={handleInputChange} saving={saving} />
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <AppearanceForm formData={formData} handleInputChange={handleInputChange} saving={saving} />
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarNavItem = ({ icon, label, active, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 w-full text-left transition-colors ${
      active
        ? 'bg-primary-50 text-primary-700 font-medium'
        : `text-gray-700 hover:bg-gray-50 ${className}`
    }`}
  >
    <div className="flex items-center">
      <span className={`mr-3 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
    {active && <ChevronRight className="w-5 h-5 text-primary-600" />}
  </button>
);

const ProfileForm = ({ formData, handleInputChange, saving }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="Enter your full name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={formData.email || ''}
            disabled
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="Enter your mobile number"
          />
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={saving} 
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const PasswordForm = ({ passwordData, handlePasswordChange, saving, passwordStrength, passwordFeedback }) => (
  <div className="max-w-md space-y-5">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all"
          placeholder="Enter your current password"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all"
          placeholder="Create a strong password"
        />
      </div>
      
      {passwordData.newPassword && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Password strength:</span>
            <span className={`text-xs font-medium ${
              passwordStrength < 2 ? 'text-red-600' : 
              passwordStrength < 4 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>{passwordFeedback}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                passwordStrength < 2 ? 'bg-red-500' : 
                passwordStrength < 4 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`} 
              style={{ width: `${(passwordStrength / 5) * 100}%` }}
            ></div>
          </div>
          <ul className="mt-2 text-xs text-gray-600 space-y-1">
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 mr-1.5 mt-0.5">•</span>
              At least 8 characters
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 mr-1.5 mt-0.5">•</span>
              Mix of uppercase & lowercase letters
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 mr-1.5 mt-0.5">•</span>
              At least one number
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 mr-1.5 mt-0.5">•</span>
              At least one special character
            </li>
          </ul>
        </div>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all"
          placeholder="Re-enter your new password"
        />
      </div>
      {passwordData.newPassword && passwordData.confirmPassword && 
       passwordData.newPassword !== passwordData.confirmPassword && (
        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
      )}
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={saving || (passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword)} 
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const NotificationsForm = ({ formData, handleInputChange, saving }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="email-notifications"
            name="preferences.notifications.email"
            type="checkbox"
            checked={formData.preferences.notifications.email}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="email-notifications" className="font-medium text-gray-700">Email Notifications</label>
          <p className="text-gray-500">Receive email updates about your account activity, test results, and new features.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="sms-notifications"
            name="preferences.notifications.sms"
            type="checkbox"
            checked={formData.preferences.notifications.sms}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="sms-notifications" className="font-medium text-gray-700">SMS Notifications</label>
          <p className="text-gray-500">Receive text messages for important updates and reminders about upcoming tests.</p>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={saving} 
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const AppearanceForm = ({ formData, handleInputChange, saving }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          formData.preferences.theme === 'light' 
            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleInputChange({
          target: { name: 'preferences.theme', value: 'light', type: 'radio' }
        })}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <input
              type="radio"
              id="light-theme"
              name="preferences.theme"
              value="light"
              checked={formData.preferences.theme === 'light'}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="light-theme" className="ml-2 font-medium text-gray-700">Light Theme</label>
          </div>
          <Sun className="w-5 h-5 text-gray-600" />
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-3 flex items-center justify-center">
          <div className="w-full h-10 bg-gray-100 rounded-md flex items-center px-3">
            <div className="w-4 h-4 rounded-full bg-primary-500 mr-2"></div>
            <div className="h-2 w-16 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          formData.preferences.theme === 'dark' 
            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleInputChange({
          target: { name: 'preferences.theme', value: 'dark', type: 'radio' }
        })}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <input
              type="radio"
              id="dark-theme"
              name="preferences.theme"
              value="dark"
              checked={formData.preferences.theme === 'dark'}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="dark-theme" className="ml-2 font-medium text-gray-700">Dark Theme</label>
          </div>
          <Moon className="w-5 h-5 text-gray-600" />
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-md p-3 flex items-center justify-center">
          <div className="w-full h-10 bg-gray-700 rounded-md flex items-center px-3">
            <div className="w-4 h-4 rounded-full bg-primary-500 mr-2"></div>
            <div className="h-2 w-16 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={saving} 
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Save Appearance
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default Profile;