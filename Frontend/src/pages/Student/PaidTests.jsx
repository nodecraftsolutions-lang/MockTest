import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock, FileText, Users, ShoppingCart, Lock, Check, User, Mail, Phone } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { createSanitizedHtml } from '../../utils/sanitize';

const PaidTests = () => {
  const [companies, setCompanies] = useState([]);
  const [tests, setTests] = useState([]);
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [cart, setCart] = useState([]);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const [pendingTestIds, setPendingTestIds] = useState([]);
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
    fetchPaidTests();
    fetchPurchasedTests();
    
    // Initialize billing details with user info
    if (user) {
      setBillingDetails({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
      });
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      if (res.data.success) {
        setCompanies(res.data.data.companies || []);
      }
    } catch {
      showError('Failed to load companies');
    }
  };

  const fetchPaidTests = async () => {
    try {
      const res = await api.get('/tests?type=paid');
      if (res.data.success) {
        setTests(res.data.data.tests || []);
      }
    } catch {
      showError('Failed to load paid tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedTests = async () => {
    try {
      const res = await api.get('/students/orders?status=completed');
      if (res.data.success) {
        const purchased = res.data.data.orders.flatMap(order =>
          order.items.map(item => item.testId)
        );
        setPurchasedTests(purchased);
      }
    } catch (err) {
      console.error('Failed to load purchased tests:', err);
    }
  };

  const handleAddToCart = (test) => {
    if (!cart.find(item => item._id === test._id)) {
      setCart([...cart, test]);
      showSuccess(`${test.title} added to cart`);
    }
  };

  const handleRemoveFromCart = (testId) => {
    setCart(cart.filter(item => item._id !== testId));
  };

  const handlePurchase = async (testIds) => {
    // Show billing modal for user to enter details
    setPendingTestIds(testIds);
    setShowBillingModal(true);
  };

  const handleBillingSubmit = async () => {
    // Validate billing details
    if (!billingDetails.name || !billingDetails.email || !billingDetails.mobile) {
      showError("Please fill all billing details");
      return;
    }

    if (!/^[0-9]{10}$/.test(billingDetails.mobile)) {
      showError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.email)) {
      showError("Please enter a valid email address");
      return;
    }

    try {
      const res = await api.post('/payments/create-order', {
        testIds: pendingTestIds,
        billingDetails
      });

      if (res.data.success) {
        const { razorpayOrder, razorpayKeyId } = res.data.data;

        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'PrepZon',
            description: 'Test Purchase',
            order_id: razorpayOrder.id,
            handler: async (response) => {
              try {
                const verifyRes = await api.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (verifyRes.data.success) {
                  showSuccess('Payment successful! Tests unlocked.');
                  setCart([]);
                  setShowBillingModal(false);
                  setPendingTestIds([]);
                  fetchPurchasedTests();
                } else {
                  showError('Payment verification failed: ' + (verifyRes.data.message || 'Unknown error'));
                }
              } catch (verifyError) {
                console.error('Payment verification error:', verifyError);
                showError('Payment verification failed. Please contact support.');
              }
            },
            prefill: {
              name: billingDetails.name,
              email: billingDetails.email,
              contact: billingDetails.mobile,
            },
            modal: {
              ondismiss: function() {
                showError("Payment cancelled");
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        };

        script.onerror = () => {
          showError("Failed to load payment gateway. Please try again.");
        };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create order';
      showError(errorMessage);
    }
  };

  const handleLaunchTest = async (testId) => {
    try {
      const res = await api.post(`/tests/${testId}/launch`, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res.data.success) {
        const { attemptId } = res.data.data;
        showSuccess('Test launched successfully!');
        navigate(`/student/exam/${testId}?attemptId=${attemptId}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to launch test');
    }
  };

  const getTestsByCompany = (companyId) =>
    tests.filter((t) => t.companyId._id === companyId);

  const isTestPurchased = (testId) => purchasedTests.includes(testId);
  const isTestInCart = (testId) => cart.find((item) => item._id === testId);
  const cartTotal = cart.reduce((sum, test) => sum + test.price, 0);

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paid Mock Tests</h1>
          <p className="text-gray-600">Premium test series from top companies</p>
        </div>
        {cart.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-900">
                  {cart.length} test(s) in cart
                </p>
                <p className="text-sm text-primary-700">Total: ₹{cartTotal}</p>
              </div>
              <button
                onClick={() => handlePurchase(cart.map((t) => t._id))}
                className="btn-primary flex items-center"
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Purchase All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Company Filter */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Company</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setSelectedCompany(null)}
            className={`p-4 border rounded-lg text-center transition-colors ${
              selectedCompany === null
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">All Companies</div>
            <div className="text-sm text-gray-600">{tests.length} tests</div>
          </button>
          {companies.map((company) => {
            const companyTests = getTestsByCompany(company._id);
            if (companyTests.length === 0) return null;
            return (
              <button
                key={company._id}
                onClick={() => setSelectedCompany(company._id)}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  selectedCompany === company._id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2" />
                )}
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-600">{companyTests.length} tests</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {companies
          .filter((c) => selectedCompany === null || c._id === selectedCompany)
          .map((company) => {
            const companyTests = getTestsByCompany(company._id);
            if (companyTests.length === 0) return null;
            return (
              <div key={company._id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">
                        {companyTests.length} paid test(s) available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {companyTests.map((test) => {
                    const isPurchased = isTestPurchased(test._id);
                    const inCart = isTestInCart(test._id);

                    return (
                      <div
                        key={test._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{test.title}</h4>
                              {isPurchased && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" /> Purchased
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" /> {test.totalQuestions} Questions
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" /> {test.duration} Minutes
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" /> {test.difficulty}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-primary-600">
                                ₹{test.price}
                              </span>
                              {test.descriptionHtml ? (
                                <div 
                                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={createSanitizedHtml(test.descriptionHtml)}
                                />
                              ) : test.description ? (
                                <p className="text-sm text-gray-600" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }}>
                                  {test.description}
                                </p>
                              ) : null}
                              {test.descriptionImageUrl && (
                                <div className="mt-2">
                                  <img 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${test.descriptionImageUrl}`}
                                    alt={`${test.title} description`}
                                    style={{
                                      width: `${test.descriptionImageWidth || 100}%`,
                                      height: `${test.descriptionImageHeight || 300}px`,
                                      objectFit: 'contain',
                                      display: test.descriptionImageAlign === 'center' ? 'block' : 'inline',
                                      margin: test.descriptionImageAlign === 'center' ? '0 auto' : test.descriptionImageAlign === 'right' ? '0 0 0 auto' : '0'
                                    }}
                                    className="rounded-lg border border-gray-200 shadow-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {isPurchased ? (
                              <button
                                onClick={() => handleLaunchTest(test._id)}
                                className="btn-primary flex items-center"
                              >
                                <Play className="w-4 h-4 mr-2" /> Start Test
                              </button>
                            ) : inCart ? (
                              <button
                                onClick={() => handleRemoveFromCart(test._id)}
                                className="btn-secondary"
                              >
                                Remove from Cart
                              </button>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleAddToCart(test)}
                                  className="btn-secondary flex items-center"
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                                </button>
                                <button
                                  onClick={() => handlePurchase([test._id])}
                                  className="btn-primary flex items-center"
                                >
                                  <Lock className="w-4 h-4 mr-2" /> Buy Now
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Billing Details Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Billing Details</h3>
                <button
                  onClick={() => setShowBillingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={billingDetails.name}
                      onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={billingDetails.email}
                      onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={billingDetails.mobile}
                      onChange={(e) => setBillingDetails({...billingDetails, mobile: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Enter 10-digit mobile number"
                      maxLength="10"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Tests to Purchase</p>
                      <p className="font-medium text-gray-900">{pendingTestIds.length} test(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{cartTotal}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBillingSubmit}
                  className="w-full btn-primary py-3"
                >
                  Proceed to Payment
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tests.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Paid Tests Available
          </h3>
          <p className="text-gray-600 mb-4">Check back later for new premium tests</p>
          <Link to="/student/free-tests" className="btn-primary">
            Try Free Tests
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaidTests;