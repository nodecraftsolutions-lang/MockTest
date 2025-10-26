import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, FileText, CheckCircle, Play, Lock, Loader2, User, Mail, Phone } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const CompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [tests, setTests] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const [pendingTestIds, setPendingTestIds] = useState([]);
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchData();
    // Initialize billing details with user info
    if (user) {
      setBillingDetails({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
      });
    }
  }, [companyId, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companyRes, testsRes, patternRes, enrollRes] = await Promise.all([
        api.get(`/companies/${companyId}`),
        api.get(`/tests?companyId=${companyId}`),
        api.get(`/companies/${companyId}/pattern`),
        api.get(`/enrollments/company/${companyId}/status`),
      ]);

      console.log('Company data:', companyRes.data);
      console.log('Tests data:', testsRes.data);
      console.log('Pattern data:', patternRes.data);
      console.log('Enrollment status full response:', enrollRes.data);
      console.log('Enrollment status data:', enrollRes.data.data);
      console.log('Is enrolled value:', enrollRes.data.data.isEnrolled);

      setCompany(companyRes.data.data.company);
      setTests(testsRes.data.data.tests || []);
      setPattern(patternRes.data.data);
      setIsEnrolled(enrollRes.data.data.isEnrolled);
      console.log('Setting isEnrolled to:', enrollRes.data.data.isEnrolled);
    } catch (error) {
      console.error("Failed to load company details:", error);
      showError("Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    // Get paid test IDs
    const paidTests = tests.filter((t) => t.type === "paid");
    const testIds = paidTests.map(test => test._id);
    
    if (testIds.length === 0) {
      showError("No paid tests available for this company");
      return;
    }
    
    // Show billing modal for payment
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
      setEnrolling(true);
      
      // Create payment order
      console.log('Sending payment order request with testIds:', pendingTestIds);
      console.log('Test IDs type and structure:', pendingTestIds.map(id => ({ id, type: typeof id })));
      
      const res = await api.post('/payments/create-order', {
        testIds: pendingTestIds,
        billingDetails
      });
      
      console.log('Payment order response:', res.data);

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
            name: company?.name || 'MockTest Pro',
            description: `Unlock ${company?.name} Paid Tests`,
            order_id: razorpayOrder.id,
            handler: async (response) => {
              try {
                const verifyRes = await api.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (verifyRes.data.success) {
                  showSuccess('Payment successful! Paid tests unlocked.');
                  setShowBillingModal(false);
                  setPendingTestIds([]);
                  // Add a small delay to ensure database operations complete
                  setTimeout(async () => {
                    await fetchData(); // Refresh all data including enrollment status
                  }, 500);
                } else {
                  showError('Payment verification failed: ' + (verifyRes.data.message || 'Unknown error'));
                }
              } catch (verifyError) {
                console.error('Payment verification error:', verifyError);
                showError('Payment verification failed. Please contact support.');
              } finally {
                setEnrolling(false);
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
                setEnrolling(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        };

        script.onerror = () => {
          showError("Failed to load payment gateway. Please try again.");
          setEnrolling(false);
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      showError(errorMessage);
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );

  const freeTests = tests.filter((t) => t.type === "free");
  const paidTests = tests.filter((t) => t.type === "paid");
  const totalPaidPrice = paidTests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
      {/* Company Header */}
      <div className="flex items-center gap-6 bg-white rounded-2xl shadow-xl p-8 mb-2 transition hover:shadow-2xl animate-fade-in">
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-20 h-20 object-contain rounded-full shadow-lg border border-primary-100 bg-white"
          />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center bg-primary-50 rounded-full shadow-lg border border-primary-100">
            <FileText className="w-10 h-10 text-primary-600" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
            {company?.name}
          </h1>
          <p className="text-gray-600 text-lg">{company?.description}</p>
        </div>
      </div>

      {/* Exam Pattern */}
      {pattern && (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 transition hover:shadow-2xl animate-fade-in">
          <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            {company?.name} Exam Pattern
          </h2>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">
                {pattern.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">
                {pattern.totalDuration} min
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600">
                {pattern.cutoffPercentage}%
              </div>
              <div className="text-sm text-gray-600">Passing Criteria</div>
            </div>
          </div>
          {/* Section Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Section-wise Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Marks per Question
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pattern.pattern.map((section, index) => (
                    <tr key={index} className="hover:bg-primary-50 transition">
                      <td className="px-6 py-4">{section.sectionName}</td>
                      <td className="px-6 py-4">{section.questionCount}</td>
                      <td className="px-6 py-4">{section.duration} min</td>
                      <td className="px-6 py-4">
                        {section.marksPerQuestion || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Available Tests */}
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 transition hover:shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2">
          <Play className="w-7 h-7 text-primary-600" />
          Available Tests
        </h2>

        {/* Free Tests */}
        {freeTests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Free Tests
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              {freeTests.map((test, idx) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-5 border border-primary-100 rounded-xl bg-primary-50/60 hover:shadow-lg transition animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{test.title}</p>
                    <p className="text-sm text-primary-600">Free Test</p>
                  </div>
                  <Link
                    to={`/student/exam/${test._id}`}
                    className="btn-primary flex items-center gap-2 px-5 py-2 rounded-full shadow hover:scale-105 transition"
                  >
                    <Play className="w-4 h-4" />
                    Take Test
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paid Tests */}
        {paidTests.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Paid Tests</h3>
              {!isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary px-6 py-2 rounded-full shadow hover:scale-105 transition"
                >
                  {enrolling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <>
                      Unlock All Paid Tests • ₹{totalPaidPrice}
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {paidTests.map((test, idx) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-5 border border-primary-100 rounded-xl bg-primary-50/60 hover:shadow-lg transition animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{test.title}</p>
                    <p className="text-sm text-primary-600">
                      Paid Test • ₹{test.price}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <Link
                      to={`/student/exam/${test._id}`}
                      className="btn-primary flex items-center gap-2 px-5 py-2 rounded-full shadow hover:scale-105 transition"
                    >
                      <Play className="w-4 h-4" />
                      Take Test
                    </Link>
                  ) : (
                    <button
                      className="btn-secondary flex items-center gap-2 px-5 py-2 rounded-full opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <Lock className="w-4 h-4" />
                      Locked
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
                      <p className="text-sm text-gray-600">Tests to Unlock</p>
                      <p className="font-medium text-gray-900">{pendingTestIds.length} paid test(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{totalPaidPrice}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBillingSubmit}
                  disabled={enrolling}
                  className="w-full btn-primary py-3"
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing Payment...
                    </span>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;