import React, { useState, useEffect } from 'react';
import {
  createHelpQuery,
  updateHelpQuery,
  deleteHelpQuery,
  getUserHelpQueries
} from '../../api/api';
import {
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Plus,
  X,
  RefreshCw,
  ChevronRight,
  Calendar,
  Send,
  Shield,
  HelpCircle,
  Headphones,
  Phone,
  Mail as MailIcon,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  FileText,
  Users,
  Heart
} from 'lucide-react';
import { toast } from 'react-toastify';

// Import your images
import vetImage1 from '../../assets/vetp1.jpg';
import vetImage2 from '../../assets/vetp2.jpg';

const VetHelp = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0
  });

  // New query state
  const [newQuery, setNewQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Edit state
  const [editQuery, setEditQuery] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);

  // View state
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const vetId = localStorage.getItem('userId');
  const vetName = localStorage.getItem('userName') || 'Vet';
  const vetEmail = localStorage.getItem('userEmail') || '';

  // Fetch vet's queries
  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await getUserHelpQueries(vetId);
      const fetchedQueries = response.data || [];
      setQueries(fetchedQueries);
      
      // Calculate stats
      const total = fetchedQueries.length;
      const open = fetchedQueries.filter(q => q.status === 'OPEN').length;
      const resolved = fetchedQueries.filter(q => q.status === 'RESOLVED').length;
      
      setStats({ total, open, resolved });
      setError('');
    } catch (err) {
      setError('Failed to fetch queries. Please try again.');
      toast.error('Failed to load help queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vetId) {
      fetchQueries();
    }
  }, [vetId]);

  // Filter queries
  const filteredQueries = queries.filter(query => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return query.status === 'OPEN';
    if (filter === 'RESOLVED') return query.status === 'RESOLVED';
    return true;
  });

  // Create new query
  const handleCreateQuery = async () => {
    if (!newQuery.trim()) {
      toast.warning('Please enter a message');
      return;
    }

    try {
      const response = await createHelpQuery(vetId, newQuery);
      
      setQueries([response.data, ...queries]);
      setNewQuery('');
      setShowNewDialog(false);
      
      // Update stats
      setStats(prev => ({
        total: prev.total + 1,
        open: prev.open + 1,
        resolved: prev.resolved
      }));
      
      toast.success('Query raised successfully! Our support team will get back to you soon.');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create query';
      toast.error(errorMsg);
    }
  };

  // Edit query
  const handleEditQuery = async () => {
    if (!editMessage.trim() || !editQuery) {
      toast.warning('Please enter a message');
      return;
    }

    try {
      const response = await updateHelpQuery(editQuery.id, vetId, editMessage);
      
      setQueries(queries.map(q => q.id === editQuery.id ? response.data : q));
      setShowEditDialog(false);
      setEditQuery(null);
      setEditMessage('');
      
      toast.success('Query updated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update query';
      toast.error(errorMsg);
    }
  };

  // Delete query
  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) {
      return;
    }

    try {
      await deleteHelpQuery(queryId, vetId);
      
      const deletedQuery = queries.find(q => q.id === queryId);
      setQueries(queries.filter(q => q.id !== queryId));
      
      // Update stats
      if (deletedQuery?.status === 'OPEN') {
        setStats(prev => ({
          total: prev.total - 1,
          open: prev.open - 1,
          resolved: prev.resolved
        }));
      }
      
      toast.success('Query deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete query';
      toast.error(errorMsg);
    }
  };

  // Open edit dialog
  const openEditDialog = (query) => {
    if (query.status === 'RESOLVED') {
      toast.warning('Resolved queries cannot be edited');
      return;
    }
    setEditQuery(query);
    setEditMessage(query.message);
    setShowEditDialog(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <AlertCircle size={12} className="mr-1" />
        Open
      </span>
    );
  };

  // Loading state
  if (loading && queries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading help queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Hero Section - Split Screen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  {/* Card 1: First Image */}
  <div className="relative overflow-hidden rounded-lg shadow-sm group">
    <img 
      src={vetImage1} 
      alt="Veterinary Support" 
      className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
      <div className="p-2 text-white">
        <h3 className="text-sm font-semibold">24/7 Support</h3>
        <p className="text-xs opacity-90">Always Available</p>
      </div>
    </div>
  </div>
  {/* Card 4: Second Image */}
  <div className="relative overflow-hidden rounded-lg shadow-sm group">
    <img 
      src={vetImage2} 
      alt="Veterinary Care" 
      className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
      <div className="p-2 text-white">
        <h3 className="text-sm font-semibold">Full Assistance</h3>
        <p className="text-xs opacity-90">All Your Needs</p>
      </div>
    </div>
  </div>
  <div className="relative overflow-hidden rounded-lg shadow-sm group">
    <img 
      src={vetImage2} 
      alt="Veterinary Care" 
      className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
      <div className="p-2 text-white">
        <h3 className="text-sm font-semibold">Full Assistance</h3>
        <p className="text-xs opacity-90">All Your Needs</p>
      </div>
    </div>
  </div>
  <div className="relative overflow-hidden rounded-lg shadow-sm group">
    <img 
      src={vetImage2} 
      alt="Veterinary Care" 
      className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
      <div className="p-2 text-white">
        <h3 className="text-sm font-semibold">Full Assistance</h3>
        <p className="text-xs opacity-90">All Your Needs</p>
      </div>
    </div>
  </div>
</div>

      {/* Header with Stats and Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle className="text-purple-600" />
            Help & Support Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your support queries. Edit or delete queries before they are resolved.
          </p>
        </div>

        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} /> Raise New Query
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Queries</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.open}</p>
              <p className="text-sm text-gray-600">Open Queries</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.resolved}</p>
              <p className="text-sm text-gray-600">Resolved Queries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Queries
          </button>
          <button
            onClick={() => setFilter('OPEN')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'OPEN'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'RESOLVED'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Resolved
          </button>
        </div>

        <button
          onClick={fetchQueries}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Queries List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <MessageSquare size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No queries found
            </h3>
            <p className="text-gray-500">
              {filter === 'OPEN'
                ? 'You have no open queries'
                : filter === 'RESOLVED'
                ? 'You have no resolved queries'
                : 'You haven\'t raised any queries yet'}
            </p>
            {filter === 'ALL' && (
              <button
                onClick={() => setShowNewDialog(true)}
                className="mt-4 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Raise your first query
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className={`p-5 hover:bg-gray-50 transition-colors ${
                  query.status === 'RESOLVED' ? 'bg-green-50/30' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-semibold text-gray-800">
                        Query #{query.id}
                      </span>
                      {getStatusBadge(query.status)}
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDate(query.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {query.message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Created: {formatDate(query.createdAt)}
                      </span>
                      {query.updatedAt !== query.createdAt && (
                        <span className="flex items-center gap-1">
                          <RefreshCw size={12} />
                          Updated: {formatDate(query.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedQuery(query);
                        setShowViewDialog(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    
                    {query.status === 'OPEN' && (
                      <>
                        <button
                          onClick={() => openEditDialog(query)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit query"
                        >
                          <Edit size={18} className="text-amber-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete query"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {query.adminReply && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={14} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">Admin Reply:</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                      {query.adminReply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Query Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="text-purple-600" />
                  Raise New Query
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Describe your issue or problem in detail
                </p>
              </div>
              <button
                onClick={() => setShowNewDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Message
                </label>
                <textarea
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  placeholder="Describe your issue or problem in detail. Our support team will review and respond as soon as possible."
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500">
                  Please be as detailed as possible to help us assist you better.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{vetName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail size={14} />
                      {vetEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewDialog(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuery}
                disabled={!newQuery.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Query Dialog */}
      {showEditDialog && editQuery && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Edit className="text-amber-600" />
                  Edit Query #{editQuery.id}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update your query message
                </p>
              </div>
              <button
                onClick={() => setShowEditDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Message
                </label>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Note: Only open queries can be edited. Resolved queries are read-only.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditDialog(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditQuery}
                disabled={!editMessage.trim() || editMessage === editQuery.message}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Query Dialog */}
      {showViewDialog && selectedQuery && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Query #{selectedQuery.id}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  {getStatusBadge(selectedQuery.status)}
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedQuery.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowViewDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Query Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(selectedQuery.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(selectedQuery.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Query */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="text-purple-600" size={20} />
                  Your Query
                </h3>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-gray-800">{selectedQuery.message}</p>
                </div>
              </div>

              {/* Admin Reply (if resolved) */}
              {selectedQuery.status === 'RESOLVED' && selectedQuery.adminReply && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Shield className="text-green-600" size={20} />
                    Admin Reply
                  </h3>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-gray-800">{selectedQuery.adminReply}</p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        Query has been resolved by the admin team
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewDialog(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedQuery.status === 'OPEN' && (
                  <button
                    onClick={() => {
                      setShowViewDialog(false);
                      openEditDialog(selectedQuery);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Edit size={18} />
                      Edit Query
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetHelp;