import { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Filter, Eye, RefreshCw,
  Download, CreditCard, Calendar, TrendingUp, AlertTriangle,
  Video, BookOpen, GraduationCap, Music, FileText, X, Edit3
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ManagePayments = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false); // New state for status modal
  const [refundData, setRefundData] = useState({
    amount: '',
    reason: ''
  });
  const [statusData, setStatusData] = useState({
    status: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, filterType, dateRange]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
      if (dateRange.toDate) params.append('toDate', dateRange.toDate);

      const response = await api.get(`/admin/orders?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    
    // Validate refund amount
    const refundAmount = parseFloat(refundData.amount);
    const maxAmount = selectedOrder?.totalAmount || 0;
    
    if (refundAmount <= 0) {
      showError('Refund amount must be greater than zero');
      return;
    }
    
    if (refundAmount > maxAmount) {
      showError(`Refund amount cannot exceed ₹${maxAmount.toLocaleString()}`);
      return;
    }
    
    if (!refundData.reason.trim()) {
      showError('Refund reason is required');
      return;
    }
    
    try {
      const response = await api.post(`/payments/orders/${selectedOrder._id}/refund`, refundData);
      if (response.data.success) {
        showSuccess('Refund processed successfully');
        setShowRefundModal(false);
        setRefundData({ amount: '', reason: '' });
        fetchOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to process refund');
    }
  };

  // New function to handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!statusData.status) {
      showError('Please select a status');
      return;
    }
    
    try {
      const response = await api.put(`/admin/orders/${selectedOrder._id}/status`, {
        status: statusData.status
      });
      
      if (response.data.success) {
        showSuccess('Order status updated successfully');
        setShowStatusModal(false);
        setStatusData({ status: '' });
        fetchOrders(); // Refresh the orders list
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const exportOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
      if (dateRange.toDate) params.append('toDate', dateRange.toDate);
      params.append('format', 'csv'); // Only CSV for Excel export

      const response = await api.get(`/admin/orders/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Orders exported to Excel successfully');
    } catch (error) {
      showError('Failed to export orders');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (filterType !== 'all') {
      const orderType = getOrderType(order.items);
      matchesType = orderType.type.toLowerCase() === filterType.toLowerCase();
    }
    
    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders
      .filter(o => o.paymentStatus === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    completedOrders: filteredOrders.filter(o => o.paymentStatus === 'completed').length,
    failedOrders: filteredOrders.filter(o => o.paymentStatus === 'failed').length
  };

  // Function to determine order type and icon
  const getOrderType = (items) => {
    if (!items || items.length === 0) return { type: 'Unknown', icon: <BookOpen className="w-4 h-4" /> };
    
    const hasTests = items.some(item => item.testId);
    const hasCourses = items.some(item => item.courseId);
    
    if (hasTests && !hasCourses) {
      return { type: 'Mock Tests', icon: <BookOpen className="w-4 h-4" /> };
    } else if (hasCourses && !hasTests) {
      // Check if it's a recording or course
      if (items.some(item => item.courseId && item.metadata?.type === 'recording')) {
        return { type: 'Recordings', icon: <Video className="w-4 h-4" /> };
      }
      return { type: 'Courses', icon: <GraduationCap className="w-4 h-4" /> };
    } else if (hasTests && hasCourses) {
      return { type: 'Mixed', icon: <FileText className="w-4 h-4" /> };
    }
    
    return { type: 'Unknown', icon: <BookOpen className="w-4 h-4" /> };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
    setDateRange({ fromDate: '', toDate: '' });
  };

  // Check if any filters are applied
  const hasFilters = searchTerm || filterStatus !== 'all' || filterType !== 'all' || dateRange.fromDate || dateRange.toDate;

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Monitor and manage all payment transactions</p>
        </div>
        <button
          onClick={exportOrders}
          className="btn-primary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.failedOrders}</p>
          <p className="text-sm text-gray-600">Failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="processing">Processing</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="Mock Tests">Mock Tests</option>
            <option value="Courses">Courses</option>
            <option value="Recordings">Recordings</option>
            <option value="Mixed">Mixed</option>
          </select>

          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
            className="input-field"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
            className="input-field"
            placeholder="To Date"
          />
        </div>
        
        {/* Clear Filters Button */}
        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const orderType = getOrderType(order.items);
                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderId}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          {orderType.icon}
                          <span className="ml-1">{orderType.type}</span>
                        </div>
                        {order.transactionId && (
                          <div className="text-xs text-gray-400 mt-1">
                            TXN: {order.transactionId.substring(0, 10)}...
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.studentId?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.studentId?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} item(s)
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {order.items[0].testTitle || order.items[0].courseTitle || 'N/A'}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.currency}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CreditCard className="w-4 h-4 mr-1" />
                        {order.paymentMethod}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <div>
                          <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        order.paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.paymentStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusData({ status: order.paymentStatus }); // Pre-fill with current status
                            setShowStatusModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Status"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {order.paymentStatus === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setRefundData({ amount: order.totalAmount.toString(), reason: '' });
                              setShowRefundModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                            title="Process Refund"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Removed individual download receipt button */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Details - #{selectedOrder.orderId}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Order ID</label>
                      <p className="text-gray-900">{selectedOrder.orderId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                      <p className="text-gray-900">{selectedOrder.transactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-gray-900 capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        selectedOrder.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        selectedOrder.paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.paymentStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-gray-900">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(selectedOrder.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedOrder.billingDetails?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedOrder.billingDetails?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mobile</label>
                      <p className="text-gray-900">{selectedOrder.billingDetails?.mobile}</p>
                    </div>
                    {selectedOrder.billingDetails?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">
                          {selectedOrder.billingDetails.address.line1}
                          {selectedOrder.billingDetails.address.line2 && `, ${selectedOrder.billingDetails.address.line2}`}
                          <br />
                          {selectedOrder.billingDetails.address.city}, {selectedOrder.billingDetails.address.state} {selectedOrder.billingDetails.address.pincode}
                          <br />
                          {selectedOrder.billingDetails.address.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items & Payment Details */}
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => {
                      const isTest = item.testId;
                      const isCourse = item.courseId;
                      const isRecording = isCourse && item.metadata?.type === 'recording';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {isTest ? (
                              <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                            ) : isRecording ? (
                              <Video className="w-5 h-5 text-purple-500 mr-2" />
                            ) : (
                              <GraduationCap className="w-5 h-5 text-green-500 mr-2" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.testTitle || item.courseTitle}
                              </p>
                              <p className="text-sm text-gray-600">
                                {isTest ? 'Mock Test' : isRecording ? 'Recording' : 'Course'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">₹{item.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ₹{selectedOrder.totalAmount - (selectedOrder.taxes?.totalTax || 0) + (selectedOrder.discountApplied?.discountAmount || 0)}
                      </span>
                    </div>
                    
                    {selectedOrder.discountApplied && selectedOrder.discountApplied.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({selectedOrder.discountApplied.couponCode})</span>
                        <span>-₹{selectedOrder.discountApplied.discountAmount?.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {selectedOrder.taxes && selectedOrder.taxes.totalTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">₹{selectedOrder.taxes.totalTax?.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.refund && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Refund Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                        <p className="text-gray-900">₹{selectedOrder.refund.refundAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reason</label>
                        <p className="text-gray-900">{selectedOrder.refund.refundReason}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedOrder.refund.refundStatus}
                        </span>
                      </div>
                      {selectedOrder.refund.refundedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Refunded At</label>
                          <p className="text-gray-900">
                            {new Date(selectedOrder.refund.refundedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setStatusData({ status: selectedOrder.paymentStatus });
                  setShowStatusModal(true);
                }}
                className="btn-secondary"
              >
                Update Status
              </button>
              
              {selectedOrder.paymentStatus === 'completed' && !selectedOrder.refund && (
                <button
                  onClick={() => {
                    setRefundData({ amount: selectedOrder.totalAmount.toString(), reason: '' });
                    setShowRefundModal(true);
                  }}
                  className="btn-secondary"
                >
                  Process Refund
                </button>
              )}
              {/* Removed individual download receipt button from modal */}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Process Refund</h2>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundData({ amount: '', reason: '' });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  max={selectedOrder?.totalAmount}
                  value={refundData.amount}
                  onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter refund amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum refundable amount: ₹{selectedOrder?.totalAmount?.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason *
                </label>
                <textarea
                  required
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Enter reason for refund"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundData({ amount: '', reason: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Update Order Status</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusData({ status: '' });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                  selectedOrder?.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedOrder?.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  selectedOrder?.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                  selectedOrder?.paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                  selectedOrder?.paymentStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedOrder?.paymentStatus}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status *
                </label>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusData({ status: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600">
            {hasFilters
              ? 'Try adjusting your search or filter criteria'
              : 'No payment orders available yet'
            }
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 btn-secondary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagePayments;