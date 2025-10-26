import { useState, useEffect } from 'react';
import { 
  Settings, Save, Key, Mail, User, Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: '',
    email: '',
    currentPassword: '',  // This will always be empty
    newPassword: '',
    confirmPassword: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // Ensure password fields are always empty on component mount
    setAdminProfile(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/admin/profile');
      if (response.data.success) {
        setAdminProfile(prev => ({
          ...prev,
          name: response.data.data.name,
          email: response.data.data.email
          // Note: We don't set currentPassword, newPassword, or confirmPassword here
        }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load admin profile:', error);
      showError('Failed to load admin profile');
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (adminProfile.email && !emailRegex.test(adminProfile.email)) {
        showError('Please enter a valid email address');
        setSaving(false);
        return;
      }

      // If changing password, validate password fields
      const isPasswordChange = adminProfile.currentPassword && adminProfile.newPassword;
      if (isPasswordChange) {
        if (adminProfile.newPassword.length < 6) {
          showError('New password must be at least 6 characters long');
          setSaving(false);
          return;
        }
        
        if (adminProfile.newPassword !== adminProfile.confirmPassword) {
          showError('New password and confirm password do not match');
          setSaving(false);
          return;
        }
      }

      // Prepare data to send
      const updateData = {};
      if (adminProfile.name) updateData.name = adminProfile.name;
      if (adminProfile.email) updateData.email = adminProfile.email;
      
      // Only include password fields if they are being changed
      if (isPasswordChange) {
        updateData.currentPassword = adminProfile.currentPassword;
        updateData.newPassword = adminProfile.newPassword;
      }

      // If no changes, show message
      if (Object.keys(updateData).length === 0 && !isPasswordChange) {
        showSuccess('No changes to save');
        setSaving(false);
        return;
      }

      const response = await api.put('/admin/profile', updateData);
      
      if (response.data.success) {
        showSuccess('Profile updated successfully');
        
        // Only clear password fields after successful password update
        if (isPasswordChange) {
          setAdminProfile(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } else {
        showError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.response && error.response.data && error.response.data.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (key, value) => {
    setAdminProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-gray-600">Manage your admin account settings</p>
      </div>

      {/* Content */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={adminProfile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={adminProfile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                className="input-field"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={adminProfile.currentPassword}
                    onChange={(e) => updateProfile('currentPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter current password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={adminProfile.newPassword}
                    onChange={(e) => updateProfile('newPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={adminProfile.confirmPassword}
                    onChange={(e) => updateProfile('confirmPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;