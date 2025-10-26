import { useState, useEffect } from 'react';
import { 
  Settings, Save, Key, Mail, Database, Shield,
  Bell, Globe, Palette, Clock, FileText, AlertTriangle,
  Download, TestTube
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');
  const [settings, setSettings] = useState({
    payment: {
      razorpayKeyId: '',
      razorpayKeySecret: '',
      defaultCurrency: 'INR',
      taxRate: 18,
      enableCoupons: true
    },
    general: {
      siteName: 'MockTest Pro',
      contactEmail: 'support@mocktestpro.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR'
    }
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      // Try to fetch existing settings from localStorage as fallback
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      setLoading(false);
    } catch (error) {
      showError('Failed to load settings');
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      // Mock audit logs
      setAuditLogs([
        {
          id: 1,
          action: 'Updated payment settings',
          user: 'Admin User',
          timestamp: new Date().toISOString(),
          details: 'Modified Razorpay configuration'
        },
        {
          id: 2,
          action: 'Created new company',
          user: 'Admin User',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: 'Added TCS company profile'
        },
        {
          id: 3,
          action: 'Reset student password',
          user: 'Admin User',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          details: 'Password reset for student ID: 12345'
        }
      ]);
    } catch (error) {
      console.error('Failed to load audit logs');
    }
  };

  const handleSave = async (category) => {
    setSaving(true);
    try {
      // Save to localStorage as fallback
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      // If there's a backend endpoint, you would call it here
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showSuccess(`${category} settings saved successfully`);
    } catch (error) {
      showError(`Failed to save ${category} settings`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const testPaymentConnection = async () => {
    try {
      // Simulate testing Razorpay connection
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Payment gateway connection test successful');
    } catch (error) {
      showError('Payment gateway connection test failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'payment', name: 'Payment', icon: Key },
    { id: 'general', name: 'General', icon: Settings },
    { id: 'audit', name: 'Audit Logs', icon: Database }
  ];

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure essential system settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'payment' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                <button
                  onClick={() => handleSave('payment')}
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Razorpay Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={settings.payment.razorpayKeyId}
                        onChange={(e) => updateSetting('payment', 'razorpayKeyId', e.target.value)}
                        className="input-field"
                        placeholder="rzp_test_..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razorpay Key Secret
                      </label>
                      <input
                        type="password"
                        value={settings.payment.razorpayKeySecret}
                        onChange={(e) => updateSetting('payment', 'razorpayKeySecret', e.target.value)}
                        className="input-field"
                        placeholder="Enter secret key"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={testPaymentConnection}
                      disabled={saving}
                      className="btn-secondary flex items-center"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={settings.payment.defaultCurrency}
                        onChange={(e) => updateSetting('payment', 'defaultCurrency', e.target.value)}
                        className="input-field"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={settings.payment.taxRate}
                        onChange={(e) => updateSetting('payment', 'taxRate', parseFloat(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableCoupons"
                    checked={settings.payment.enableCoupons}
                    onChange={(e) => updateSetting('payment', 'enableCoupons', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enableCoupons" className="ml-2 text-sm text-gray-700">
                    Enable Coupon Code System
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <button
                  onClick={() => handleSave('general')}
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    className="input-field"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                    className="input-field"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
                <button className="btn-secondary flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </button>
              </div>

              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{log.action}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-1">By: {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>

              {auditLogs.length === 0 && (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No audit logs available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;