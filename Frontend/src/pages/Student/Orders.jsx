import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Download, Eye, Calendar, CreditCard,
  CheckCircle, XCircle, Clock, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
                <td>${item.testTitle}</td>
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
          <p className="text-gray-600">Track your test purchases and payments</p>
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
                {getStatusIcon(order.paymentStatus)}
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
                        <ShoppingBag className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.testTitle}</p>
                        <p className="text-sm text-gray-600">Mock Test</p>
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
                  
                  <button className="btn-secondary flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-4">You haven't made any purchases yet</p>
          <Link to="/student/paid-tests" className="btn-primary">
            Browse Paid Tests
          </Link>
        </div>
      )}
    </div>
  );
};

export default Orders;