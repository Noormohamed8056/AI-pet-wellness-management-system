import React, { useState, useEffect } from 'react';
import {
  getAllHelpQueries,
  getHelpQueriesByType,
  getHelpQueriesByStatus,
  resolveHelpQuery,
  deleteHelpQuery
} from '../../api/api';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  X,
  RefreshCw,
  Shield,
  HelpCircle,
  Filter,
  Search,
  Eye,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Mail as MailIcon,
  FileText,
  Users,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';

const AdminSupport = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'ALL', // ALL, OWNER, VET
    status: 'ALL', // ALL, OPEN, RESOLVED
  });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    owners: 0,
    vets: 0
  });

  // Resolve dialog state
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [resolving, setResolving] = useState(false);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Expanded rows for mobile view
  const [expandedRows, setExpandedRows] = useState([]);

  // Fetch all queries
  const fetchQueries = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filters.type !== 'ALL' && filters.status !== 'ALL') {
        // Need to filter manually for combined filters
        response = await getAllHelpQueries();
      } else if (filters.type !== 'ALL') {
        response = await getHelpQueriesByType(filters.type);
      } else if (filters.status !== 'ALL') {
        response = await getHelpQueriesByStatus(filters.status);
      } else {
        response = await getAllHelpQueries();
      }
      
      const fetchedQueries = response.data || [];
      
      // Apply combined filters if needed
      let filteredQueries = fetchedQueries;
      if (filters.type !== 'ALL' && filters.status !== 'ALL') {
        filteredQueries = fetchedQueries.filter(q => 
          q.raisedBy === filters.type && q.status === filters.status
        );
      }
      
      // Apply search filter
      if (searchTerm) {
        filteredQueries = filteredQueries.filter(q =>
          q.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.adminReply?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setQueries(filteredQueries);
      
      // Calculate stats from all queries
      const allResponse = await getAllHelpQueries();
      const allQueries = allResponse.data || [];
      
      const total = allQueries.length;
      const open = allQueries.filter(q => q.status === 'OPEN').length;
      const resolved = allQueries.filter(q => q.status === 'RESOLVED').length;
      const owners = allQueries.filter(q => q.raisedBy === 'OWNER').length;
      const vets = allQueries.filter(q => q.raisedBy === 'VET').length;
      
      setStats({ total, open, resolved, owners, vets });
      
    } catch (err) {
      toast.error('Failed to load help queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [filters, searchTerm]);

  // Resolve query
  const handleResolveQuery = async () => {
    if (!adminReply.trim()) {
      toast.warning('Please enter a reply message');
      return;
    }

    setResolving(true);
    try {
      const response = await resolveHelpQuery(selectedQuery.id, adminReply);
      
      // Update the query in the list
      setQueries(queries.map(q => q.id === selectedQuery.id ? response.data : q));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        open: prev.open - 1,
        resolved: prev.resolved + 1
      }));
      
      setShowResolveDialog(false);
      setAdminReply('');
      setSelectedQuery(null);
      
      toast.success('Query resolved successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to resolve query';
      toast.error(errorMsg);
    } finally {
      setResolving(false);
    }
  };

  // Delete query (admin can delete any)
  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) {
      return;
    }

    try {
      // Get user ID from the query (assuming query has user object)
      const queryToDelete = queries.find(q => q.id === queryId);
      if (!queryToDelete?.user?.id) {
        toast.error('Cannot delete: User information missing');
        return;
      }

      await deleteHelpQuery(queryId, queryToDelete.user.id);
      
      // Remove from list
      const deletedQuery = queries.find(q => q.id === queryId);
      setQueries(queries.filter(q => q.id !== queryId));
      
      // Update stats
      if (deletedQuery) {
        const statusKey = deletedQuery.status === 'OPEN' ? 'open' : 'resolved';
        const typeKey = deletedQuery.raisedBy === 'OWNER' ? 'owners' : 'vets';
        
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          [statusKey]: prev[statusKey] - 1,
          [typeKey]: prev[typeKey] - 1
        }));
      }
      
      toast.success('Query deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete query';
      toast.error(errorMsg);
    }
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

  // Get user type badge
  const getUserTypeBadge = (type) => {
    if (type === 'VET') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ShieldCheck size={12} className="mr-1" />
          Veterinarian
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <Users size={12} className="mr-1" />
        Pet Owner
      </span>
    );
  };

  // Toggle expanded row for mobile
  const toggleRowExpand = (queryId) => {
    setExpandedRows(prev =>
      prev.includes(queryId)
        ? prev.filter(id => id !== queryId)
        : [...prev, queryId]
    );
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      // First, fetch all queries for the report
      const fetchAllForReport = async () => {
        try {
          const response = await getAllHelpQueries();
          const allQueries = response.data || [];
          
          // Separate resolved and open queries
          const resolvedQueries = allQueries.filter(q => q.status === 'RESOLVED');
          const openQueries = allQueries.filter(q => q.status === 'OPEN');
          
          // Create HTML content for PDF
          const element = document.createElement('div');
          
          element.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">PetCare Support Report</h1>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Help & Support Queries Summary</p>
                <p style="color: #6b7280; margin: 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <!-- Summary Stats -->
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Summary</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">${stats.total}</div>
                    <div style="font-size: 12px; color: #6b7280;">Total Queries</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.open}</div>
                    <div style="font-size: 12px; color: #6b7280;">Open Queries</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.resolved}</div>
                    <div style="font-size: 12px; color: #6b7280;">Resolved Queries</div>
                  </div>
                </div>
              </div>
              
              <!-- Resolved Queries Section -->
              <div style="margin-bottom: 40px;">
                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  Resolved Queries (${resolvedQueries.length})
                </h2>
                ${resolvedQueries.length > 0 ? resolvedQueries.map((query, index) => `
                  <div style="margin-bottom: 25px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                      <div>
                        <h3 style="color: #065f46; margin: 0 0 5px 0; font-size: 16px;">Query #${query.id}</h3>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">
                          ${query.user?.name || ''}• 
                          ${query.user?.email || 'No email'} • 
                          ${query.raisedBy === 'VET' ? 'Veterinarian' : 'Pet Owner'}
                        </p>
                        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
                          Created: ${formatDate(query.createdAt)} | Resolved: ${formatDate(query.updatedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 14px;">Issue Reported:</h4>
                      <p style="color: #374151; margin: 0; padding: 10px; background: white; border-radius: 6px; font-size: 13px; line-height: 1.5;">
                        ${query.message}
                      </p>
                    </div>
                    
                    <div>
                      <h4 style="color: #065f46; margin: 0 0 8px 0; font-size: 14px;">Admin Response:</h4>
                      <p style="color: #065f46; margin: 0; padding: 10px; background: #d1fae5; border-radius: 6px; font-size: 13px; line-height: 1.5;">
                        ${query.adminReply || 'No reply provided'}
                      </p>
                    </div>
                  </div>
                `).join('') : `
                  <div style="text-align: center; padding: 30px; background: #f8fafc; border-radius: 8px;">
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">No resolved queries found</p>
                  </div>
                `}
              </div>
              
              <!-- Open Queries Section -->
              <div>
                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                  Open Queries (${openQueries.length})
                </h2>
                ${openQueries.length > 0 ? openQueries.map((query, index) => `
                  <div style="margin-bottom: 25px; padding: 20px; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                      <div>
                        <h3 style="color: #92400e; margin: 0 0 5px 0; font-size: 16px;">Query #${query.id}</h3>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">
                          ${query.user?.name || ''}• 
                          ${query.user?.email || 'No email'} • 
                          ${query.raisedBy === 'VET' ? 'Veterinarian' : 'Pet Owner'}
                        </p>
                        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
                          Created: ${formatDate(query.createdAt)} | Last Updated: ${formatDate(query.updatedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">Issue Reported:</h4>
                      <p style="color: #374151; margin: 0; padding: 10px; background: white; border-radius: 6px; font-size: 13px; line-height: 1.5;">
                        ${query.message}
                      </p>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #fed7aa; border-radius: 6px;">
                      <p style="color: #92400e; margin: 0; font-size: 12px; font-weight: bold;">
                        ⏳ Awaiting Response
                      </p>
                    </div>
                  </div>
                `).join('') : `
                  <div style="text-align: center; padding: 30px; background: #f8fafc; border-radius: 8px;">
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">No open queries found</p>
                  </div>
                `}
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">
                  PetCare Veterinary Platform • Support System Report
                </p>
                <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 11px;">
                  Generated automatically by Admin Support System
                </p>
              </div>
            </div>
          `;
          
          // Generate PDF
          const opt = {
            margin: [10, 10, 10, 10],
            filename: `petcare-support-report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2,
              useCORS: true,
              letterRendering: true
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true
            },
            pagebreak: { mode: 'avoid-all' }
          };
          
          // Generate and save PDF
          html2pdf().set(opt).from(element).save().then(() => {
            toast.success('PDF report generated successfully!');
          }).catch(err => {
            console.error('PDF generation error:', err);
            toast.error('Failed to generate PDF');
          });
          
        } catch (error) {
          console.error('Error fetching data for PDF:', error);
          toast.error('Failed to prepare data for PDF');
        }
      };
      
      fetchAllForReport();
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  // Loading state
  if (loading && queries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading support queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-purple-600" />
            Admin Support Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and resolve help queries from veterinarians and pet owners
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Printer size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.vets}</p>
              <p className="text-sm text-gray-600">Vet Queries</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Users className="text-pink-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.owners}</p>
              <p className="text-sm text-gray-600">Owner Queries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search queries, users, or messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* User Type Filter */}
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2.5 pl-4 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Users</option>
                <option value="OWNER">Pet Owners</option>
                <option value="VET">Veterinarians</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Filter size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2.5 pl-4 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Filter size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchQueries}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {queries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <MessageSquare size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No queries found
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'No queries match the selected filters'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID / User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status / Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {queries.map((query) => (
                    <tr key={query.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <User className="text-gray-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Query #{query.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {query.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MailIcon size={12} />
                              {query.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-gray-800 line-clamp-2 mb-2">
                            {query.message}
                          </p>
                          {query.adminReply && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-xs font-medium text-green-700 mb-1">Reply:</p>
                              <p className="text-xs text-gray-700 line-clamp-2">
                                {query.adminReply}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {getStatusBadge(query.status)}
                          {getUserTypeBadge(query.raisedBy)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <Clock size={12} />
                            Created: {formatDate(query.createdAt)}
                          </p>
                          <p className="flex items-center gap-1">
                            <RefreshCw size={12} />
                            Updated: {formatDate(query.updatedAt)}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedQuery(query);
                              setViewDialogOpen(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          
                          {query.status === 'OPEN' && (
                            <button
                              onClick={() => {
                                setSelectedQuery(query);
                                setAdminReply('');
                                setShowResolveDialog(true);
                              }}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Resolve query"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteQuery(query.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete query"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {queries.map((query) => (
                <div key={query.id} className="p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleRowExpand(query.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <User className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Query #{query.id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(query.status)}
                            {getUserTypeBadge(query.raisedBy)}
                          </div>
                        </div>
                      </div>
                      <div>
                        {expandedRows.includes(query.id) ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedRows.includes(query.id) && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Message</p>
                        <p className="text-gray-800 text-sm">{query.message}</p>
                      </div>
                      
                      {query.adminReply && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Admin Reply</p>
                          <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                            {query.adminReply}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">User Info</p>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <User className="text-gray-600" size={16} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-800">
                              {query.user?.name}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MailIcon size={12} />
                              {query.user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Created</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(query.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Updated</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <RefreshCw size={12} />
                            {formatDate(query.updatedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <button
                          onClick={() => {
                            setSelectedQuery(query);
                            setViewDialogOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        
                        {query.status === 'OPEN' && (
                          <button
                            onClick={() => {
                              setSelectedQuery(query);
                              setAdminReply('');
                              setShowResolveDialog(true);
                            }}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Resolve query"
                          >
                            <CheckCircle size={18} className="text-green-600" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete query"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Resolve Dialog */}
      {showResolveDialog && selectedQuery && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" />
                  Resolve Query #{selectedQuery.id}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Provide a reply to resolve this query
                </p>
              </div>
              <button
                onClick={() => setShowResolveDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Original Query */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Original Query</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{selectedQuery.message}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedQuery.user?.name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MailIcon size={14} />
                      {selectedQuery.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      User Type: {selectedQuery.raisedBy === 'VET' ? 'Veterinarian' : 'Pet Owner'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Reply */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Reply *
                </label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Enter your response to resolve this query..."
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500">
                  This reply will be sent to the user and mark the query as resolved.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResolveDialog(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={resolving}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveQuery}
                disabled={!adminReply.trim() || resolving}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resolving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resolving...
                  </span>
                ) : 'Resolve Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {viewDialogOpen && selectedQuery && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Query #{selectedQuery.id} Details
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  {getStatusBadge(selectedQuery.status)}
                  {getUserTypeBadge(selectedQuery.raisedBy)}
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedQuery.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewDialogOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User Name</p>
                    <p className="font-medium text-gray-800">
                      {selectedQuery.user?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <MailIcon size={14} />
                      {selectedQuery.user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User Type</p>
                    <p className="font-medium text-gray-800">
                      {selectedQuery.raisedBy === 'VET' ? 'Veterinarian' : 'Pet Owner'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 bg-blue-50 rounded-lg">
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

              {/* Original Query */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Original Query</h3>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-gray-800">{selectedQuery.message}</p>
                </div>
              </div>

              {/* Admin Reply (if exists) */}
              {selectedQuery.adminReply && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Shield className="text-green-600" size={20} />
                    Admin Reply
                  </h3>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-gray-800">{selectedQuery.adminReply}</p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        Query resolved on {formatDate(selectedQuery.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedQuery.status === 'OPEN' && (
                  <button
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedQuery(selectedQuery);
                      setAdminReply('');
                      setShowResolveDialog(true);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle size={18} />
                      Resolve Now
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

export default AdminSupport;