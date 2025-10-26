import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Download, Eye, Calendar, CreditCard,
  CheckCircle, XCircle, Clock, RefreshCw, BookOpen, FileText,
  X, MapPin, Mail, Phone, User
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Link } from "react-router-dom";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const response = await api.get(`/students/orders?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getOrderType = (items) => {
    if (items && items.length > 0) {
      const hasTest = items.some(item => item.testId);
      const hasCourse = items.some(item => item.courseId);
      
      if (hasTest && hasCourse) return 'Mixed';
      if (hasTest) return 'Test';
      if (hasCourse) return 'Course';
    }
    return 'Unknown';
  };

  const getOrderIcon = (items) => {
    const type = getOrderType(items);
    switch (type) {
      case 'Test':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Course':
        return <BookOpen className="w-5 h-5 text-green-500" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-purple-500" />;
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const downloadReceipt = async (orderId) => {
    try {
      const response = await api.get(`/payments/orders/${orderId}/receipt`);
      if (response.data.success) {
        // Create and download receipt
        const receiptData = response.data.data.receipt;
        const receiptContent = generateReceiptHTML(receiptData);
        
        const blob = new Blob([receiptContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptData.orderId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      showError('Failed to download receipt');
    }
  };

  const generateReceiptHTML = (receipt) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .details { margin-bottom: 20px; }
          .items { border-collapse: collapse; width: 100%; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MockTest Pro</h1>
          <h2>Payment Receipt</h2>
        </div>
        <div class="details">
          <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
          <p><strong>Order ID:</strong> ${receipt.orderId}</p>
          <p><strong>Date:</strong> ${new Date(receipt.paymentDate).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${receipt.studentName}</p>
          <p><strong>Email:</strong> ${receipt.email}</p>
          <p><strong>Transaction ID:</strong> ${receipt.transactionId}</p>
        </div>
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${receipt.items.map(item => `
              <tr>
                <td>${item.testTitle || item.courseTitle}</td>
                <td>₹${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Total Amount: ₹${receipt.totalAmount}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your purchases and payments</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Orders</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getOrderIcon(order.items)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderId}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {order.paymentMethod}
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      {getOrderType(order.items)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  ₹{order.totalAmount}
                </div>
                {getStatusBadge(order.paymentStatus)}
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Items Purchased</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        {item.testId ? (
                          <FileText className="w-5 h-5 text-primary-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.testTitle || item.courseTitle}</p>
                        <p className="text-sm text-gray-600">
                          {item.testId ? 'Mock Test' : 'Course'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            {(order.discountApplied || order.taxes) && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ₹{order.totalAmount - (order.taxes?.totalTax || 0) + (order.discountApplied?.discountAmount || 0)}
                    </span>
                  </div>
                  
                  {order.discountApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({order.discountApplied.couponCode})</span>
                      <span>-₹{order.discountApplied.discountAmount}</span>
                    </div>
                  )}
                  
                  {order.taxes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">₹{order.taxes.totalTax}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Details */}
            {order.billingDetails && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Billing Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{order.billingDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{order.billingDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mobile</p>
                    <p className="font-medium">{order.billingDetails.mobile}</p>
                  </div>
                  {order.billingDetails.address && (
                    <div>
                      <p className="text-gray-600">Address</p>
                      <p className="font-medium">
                        {order.billingDetails.address.line1}
                        {order.billingDetails.address.line2 && `, ${order.billingDetails.address.line2}`}
                        <br />
                        {order.billingDetails.address.city}, {order.billingDetails.address.state} {order.billingDetails.address.pincode}
                        <br />
                        {order.billingDetails.address.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {order.transactionId && (
                    <p>Transaction ID: {order.transactionId}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {order.paymentStatus === 'completed' && (
                    <button
                      onClick={() => downloadReceipt(order._id)}
                      className="btn-secondary flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </button>
                  )}
                  
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="btn-secondary flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{selectedOrder.orderId}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-1" />
                        {selectedOrder.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      ₹{selectedOrder.totalAmount}
                    </div>
                    {getStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                </div>
                
                {/* Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Items Purchased</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            {item.testId ? (
                              <FileText className="w-5 h-5 text-primary-600" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.testTitle || item.courseTitle}</p>
                            <p className="text-sm text-gray-600">
                              {item.testId ? 'Mock Test' : 'Course'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ₹{selectedOrder.totalAmount - (selectedOrder.taxes?.totalTax || 0) + (selectedOrder.discountApplied?.discountAmount || 0)}
                      </span>
                    </div>
                    
                    {selectedOrder.discountApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({selectedOrder.discountApplied.couponCode})</span>
                        <span>-₹{selectedOrder.discountApplied.discountAmount}</span>
                      </div>
                    )}
                    
                    {selectedOrder.taxes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">₹{selectedOrder.taxes.totalTax}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
                
                {/* Billing Details */}
                {selectedOrder.billingDetails && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Billing Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-medium">{selectedOrder.billingDetails.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium">{selectedOrder.billingDetails.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-600">Mobile</p>
                          <p className="font-medium">{selectedOrder.billingDetails.mobile}</p>
                        </div>
                      </div>
                      {selectedOrder.billingDetails.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Address</p>
                            <p className="font-medium">
                              {selectedOrder.billingDetails.address.line1}
                              {selectedOrder.billingDetails.address.line2 && `, ${selectedOrder.billingDetails.address.line2}`}
                              <br />
                              {selectedOrder.billingDetails.address.city}, {selectedOrder.billingDetails.address.state} {selectedOrder.billingDetails.address.pincode}
                              <br />
                              {selectedOrder.billingDetails.address.country}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Transaction Details */}
                {selectedOrder.transactionId && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
                    <div className="text-sm bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600">Transaction ID</p>
                      <p className="font-medium break-all">{selectedOrder.transactionId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-4">You haven't made any purchases yet</p>
          <div className="flex justify-center space-x-4">
            <Link to="/student/paid-tests" className="btn-primary">
              Browse Paid Tests
            </Link>
            <Link to="/student/courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;