import { useState, useEffect } from 'react';
import { Save, Lock, User, Mail, Phone, Settings } from 'lucide-react';
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

  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

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

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card">
        {/* Inside Profile component -> Profile Card */}
          <div className="flex items-center space-x-6 mb-6">
            {/* Default Avatar with initials */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: '#4F46E5' }}> 
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-12 h-12 text-gray-200" />}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(profile?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>


        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <TabButton label="Profile Information" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            <TabButton label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <TabButton label="Preferences" active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <ProfileForm formData={formData} handleInputChange={handleInputChange} saving={saving} />
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <PasswordForm passwordData={passwordData} handlePasswordChange={handlePasswordChange} saving={saving} />
          </form>
        )}

        {activeTab === 'preferences' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <PreferencesForm formData={formData} handleInputChange={handleInputChange} saving={saving} />
          </form>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-1 border-b-2 font-medium text-sm ${
      active
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const ProfileForm = ({ formData, handleInputChange, saving }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
      <div className="relative">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="input-field pl-10"
          placeholder="Enter your full name"
        />
        <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
      <div className="relative">
        <input
          type="email"
          value={formData.email || ''}
          disabled
          className="input-field pl-10 bg-gray-50 cursor-not-allowed"
        />
        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
      <div className="relative">
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleInputChange}
          className="input-field pl-10"
          placeholder="Enter your mobile number"
        />
        <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div className="flex justify-end col-span-2">
      <button type="submit" disabled={saving} className="btn-primary flex items-center">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
);

const PasswordForm = ({ passwordData, handlePasswordChange, saving }) => (
  <div className="max-w-md space-y-4">
    {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
      <div key={i}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
        </label>
        <div className="relative">
          <input
            type="password"
            name={field}
            value={passwordData[field]}
            onChange={handlePasswordChange}
            className="input-field pl-10"
            placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
          />
          <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>
    ))}

    <div className="flex justify-end">
      <button type="submit" disabled={saving} className="btn-primary flex items-center">
        <Lock className="w-4 h-4 mr-2" />
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </div>
  </div>
);

const PreferencesForm = ({ formData, handleInputChange, saving }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
      <label className="flex items-center">
        <input
          type="checkbox"
          name="preferences.notifications.email"
          checked={formData.preferences.notifications.email}
          onChange={handleInputChange}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="ml-3 text-sm text-gray-700">Email notifications</span>
      </label>
      <label className="flex items-center">
        <input
          type="checkbox"
          name="preferences.notifications.sms"
          checked={formData.preferences.notifications.sms}
          onChange={handleInputChange}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="ml-3 text-sm text-gray-700">SMS notifications</span>
      </label>
    </div>

    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
      {['light', 'dark'].map((theme) => (
        <label key={theme} className="flex items-center">
          <input
            type="radio"
            name="preferences.theme"
            value={theme}
            checked={formData.preferences.theme === theme}
            onChange={handleInputChange}
            className="border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-3 text-sm text-gray-700">
            {theme.charAt(0).toUpperCase() + theme.slice(1)} theme
          </span>
        </label>
      ))}
    </div>

    <div className="flex justify-end">
      <button type="submit" disabled={saving} className="btn-primary flex items-center">
        <Settings className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  </div>
);

export default Profile;
