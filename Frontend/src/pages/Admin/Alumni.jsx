import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Eye, UserX, RefreshCw,
  Mail, Phone, Calendar, Activity,
  ChevronDown, ChevronUp, X, Check, AlertCircle, 
  UserCheck, FileText, CreditCard, TrendingUp,
  Star, Plus, Edit, Trash2
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';

const ManageAlumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
    testimonial: '',
    photoUrl: '',
    rating: 5,
    featured: false,
    isActive: true
  });

  // Fetch alumni from backend
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') params.append('status', filterStatus);

        const response = await api.get(`/alumni?${params.toString()}`);
        if (response.data.success) {
          setAlumni(response.data.data.alumni);
        } else {
          showError(response.data.message || 'Failed to load alumni');
        }
      } catch (error) {
        showError('Failed to load alumni');
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [filterStatus]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Ensure rating is a number
    if (name === 'rating') {
      newValue = parseInt(value, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple frontend validation
    if (!formData.name || !formData.name.trim()) {
      showError('Name is required');
      return;
    }
    
    if (!formData.email || !formData.email.trim()) {
      showError('Email is required');
      return;
    }
    
    if (!formData.company || !formData.company.trim()) {
      showError('Company is required');
      return;
    }
    
    if (!formData.position || !formData.position.trim()) {
      showError('Position is required');
      return;
    }
    
    if (!formData.testimonial || !formData.testimonial.trim()) {
      showError('Testimonial is required');
      return;
    }
    
    if (formData.testimonial.length > 500) {
      showError('Testimonial cannot exceed 500 characters');
      return;
    }
    
    if (formData.rating < 1 || formData.rating > 5) {
      showError('Rating must be between 1 and 5');
      return;
    }
    
    // Prepare the data to send
    const dataToSend = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      company: formData.company.trim(),
      position: formData.position.trim(),
      testimonial: formData.testimonial.trim(),
      photoUrl: formData.photoUrl?.trim() || null,
      rating: parseInt(formData.rating, 10),
      featured: !!formData.featured,
      isActive: !!formData.isActive
    };
    
    try {
      let response;
      if (selectedAlumni) {
        // Edit existing alumni
        response = await api.put(`/alumni/${selectedAlumni._id}`, dataToSend);
      } else {
        // Create new alumni
        response = await api.post('/alumni', dataToSend);
      }
      
      if (response.data.success) {
        // Add a small delay to ensure state updates properly
        setTimeout(() => {
          showSuccess(selectedAlumni ? 'Alumni updated successfully' : 'Alumni created successfully');
          if (selectedAlumni) {
            setShowEditModal(false);
          } else {
            setShowAddModal(false);
          }
          fetchAlumni();
          resetForm();
        }, 100);
      } else {
        showError(response.data.message || 'Failed to save alumni');
      }
    } catch (error) {
      // Even if there's an error, if the alumni was created/updated successfully, don't show error
      // This handles cases where the request succeeds but the response has issues
      if (error.response?.status === 200 || error.response?.status === 201) {
        showSuccess(selectedAlumni ? 'Alumni updated successfully' : 'Alumni created successfully');
        if (selectedAlumni) {
          setShowEditModal(false);
        } else {
          setShowAddModal(false);
        }
        fetchAlumni();
        resetForm();
      } else {
        showError(error.response?.data?.message || 'Failed to save alumni');
      }
    }
  };

  const handleDelete = async (alumniId) => {
    if (window.confirm('Are you sure you want to delete this alumni?')) {
      try {
        const response = await api.delete(`/alumni/${alumniId}`);
        if (response.data.success) {
          showSuccess('Alumni deleted successfully');
          fetchAlumni();
        } else {
          showError(response.data.message || 'Failed to delete alumni');
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete alumni');
      }
    }
  };

  const viewAlumniDetails = async (alumniId) => {
    try {
      const response = await api.get(`/alumni/${alumniId}`);
      if (response.data.success) {
        setSelectedAlumni(response.data.data);
        setShowDetailsModal(true);
      } else {
        showError(response.data.message || 'Failed to load alumni details');
      }
    } catch (error) {
      showError('Failed to load alumni details');
    }
  };

  const editAlumni = async (alumni) => {
    setSelectedAlumni(alumni);
    setFormData({
      name: alumni.name,
      email: alumni.email,
      company: alumni.company,
      position: alumni.position,
      testimonial: alumni.testimonial,
      photoUrl: alumni.photoUrl || '',
      rating: alumni.rating,
      featured: alumni.featured || false,
      isActive: alumni.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      position: '',
      testimonial: '',
      photoUrl: '',
      rating: 5,
      featured: false,
      isActive: true
    });
    setSelectedAlumni(null);
  };

  const filteredAlumni = alumni.filter(alumni => {
    const matchesSearch = 
      alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = alumni.isActive;
    if (filterStatus === 'inactive') matchesStatus = !alumni.isActive;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Alumni Management</h1>
            <p className="text-indigo-100">View and manage alumni testimonials</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Alumni</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alumni</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alumni.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alumni</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alumni.filter(a => a.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alumni.filter(a => a.featured).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alumni.length > 0 
                  ? (alumni.reduce((sum, a) => sum + (a.rating || 0), 0) / alumni.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, company, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Alumni Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumni
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company & Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlumni.map((alumnus) => (
                <tr key={alumnus._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {alumnus.photoUrl ? (
                          <img className="h-10 w-10 rounded-full" src={alumnus.photoUrl} alt={alumnus.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-800 font-medium">
                              {alumnus.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{alumnus.name}</div>
                        <div className="text-sm text-gray-500">{alumnus.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{alumnus.company}</div>
                    <div className="text-sm text-gray-500">{alumnus.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-900">{alumnus.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alumnus.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {alumnus.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alumnus.featured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => viewAlumniDetails(alumnus._id)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editAlumni(alumnus)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(alumnus._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAlumni.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alumni found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No alumni match your search criteria.' 
                : 'Get started by adding a new alumni.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Alumni Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAlumni ? 'Edit Alumni' : 'Add New Alumni'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Featured on Homepage
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial *
                </label>
                <textarea
                  name="testimonial"
                  value={formData.testimonial}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.testimonial.length}/500 characters
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {selectedAlumni ? 'Update Alumni' : 'Add Alumni'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Alumni Details Modal */}
      {showDetailsModal && selectedAlumni && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alumni Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAlumni(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {selectedAlumni.photoUrl ? (
                    <img 
                      className="h-16 w-16 rounded-full" 
                      src={selectedAlumni.photoUrl} 
                      alt={selectedAlumni.name} 
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium text-xl">
                        {selectedAlumni.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{selectedAlumni.name}</h4>
                  <p className="text-gray-600">{selectedAlumni.email}</p>
                  <div className="flex items-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < selectedAlumni.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                    <span className="ml-2 text-gray-600">{selectedAlumni.rating}/5</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Company</h5>
                  <p className="text-gray-900">{selectedAlumni.company}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Position</h5>
                  <p className="text-gray-900">{selectedAlumni.position}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Status</h5>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedAlumni.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedAlumni.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Featured</h5>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedAlumni.featured 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAlumni.featured ? 'Featured' : 'Not Featured'}
                  </span>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-500">Testimonial</h5>
                <p className="text-gray-900 mt-1">{selectedAlumni.testimonial}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAlumni(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManageAlumni;