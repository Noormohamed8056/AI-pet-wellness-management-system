import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Edit,
  Save,
  X,
  Camera,
  LogOut,
  ChevronRight,
  Home,
  Calendar,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getUserDetails,
  getOwnerProfile,
  saveOwnerProfile,
  updateOwnerProfile,
  resetPassword,
  updateUserDetails
} from '../../api/api';

const Profile = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  // State Management
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Form States
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    profileImageUrl: '',
    bio: ''
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Load user data
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load user details
      const userRes = await getUserDetails(userId);
      setUser(userRes.data);
      setUserForm({
        name: userRes.data.name || '',
        email: userRes.data.email || '',
        phone: userRes.data.phone || ''
      });

      // Load profile if exists
      try {
        const profileRes = await getOwnerProfile(userId);
        setProfile(profileRes.data);
        setProfileForm({
          fullName: profileRes.data.fullName || '',
          address: profileRes.data.address || '',
          city: profileRes.data.city || '',
          state: profileRes.data.state || '',
          pincode: profileRes.data.pincode || '',
          profileImageUrl: profileRes.data.profileImageUrl || '',
          bio: profileRes.data.bio || ''
        });
      } catch (err) {
        // Profile doesn't exist yet - that's okay
        console.log('No profile found, will create new one');
        setProfile(null);
      }
    } catch (err) {
      setError('Failed to load user data');
      toast.error('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile Form Change
  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle User Form Change
  const handleUserChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle Password Change
  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  // Save Profile - Then automatically show view mode
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (profile) {
        // Update existing profile
        await updateOwnerProfile(userId, profileForm);
        toast.success('✅ Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setSuccess('Profile updated successfully!');
      } else {
        // Create new profile
        await saveOwnerProfile(userId, profileForm);
        toast.success('🎉 Profile created successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setSuccess('Profile created successfully!');
      }
      
      // Reload data
      await loadUserData();
      // After save, exit edit mode and stay in view mode
      setIsEditing(false);
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to save profile';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update User Details
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserDetails(userId, {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone
      });
      
      toast.success('✨ Account details updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setSuccess('Account details updated successfully!');
      await loadUserData();
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to update account';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (passwordForm.newPassword.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(userId, passwordForm.newPassword);
      toast.success('🔐 Password reset successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setSuccess('Password reset successfully!');
      setIsChangingPassword(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to reset password';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.clear();
    toast.info('👋 Logged out successfully!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    navigate('/login');
  };

  // Cancel Edit
  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset form to original values
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        profileImageUrl: profile.profileImageUrl || '',
        bio: profile.bio || ''
      });
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Redirect vets to their own profile page
  if (userRole === 'VET') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <Award size={48} className="mx-auto text-violet-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Veterinarian Profile</h2>
          <p className="text-gray-600 mb-6">This page is for pet owners. Please visit your veterinarian dashboard.</p>
          <button
            onClick={() => navigate('/vet/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go to Vet Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <User className="text-violet-600" size={32} />
              My Profile
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Edit your profile information' : 'View your profile details'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Summary - ALWAYS VISIBLE */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              {/* Profile Image */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {profileForm.profileImageUrl ? (
                      <img 
                        src={profileForm.profileImageUrl} 
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg">
                      <Camera size={16} className="text-violet-600" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-white mt-4">
                  {profile?.fullName || user?.name || 'Pet Parent'}
                </h2>
                <p className="text-white/90 text-sm flex items-center justify-center gap-1 mt-1">
                  <Mail size={14} />
                  {user?.email}
                </p>
                {user?.phone && (
                  <p className="text-white/90 text-sm flex items-center justify-center gap-1 mt-1">
                    <Phone size={14} />
                    {user.phone}
                  </p>
                )}
              </div>

              {/* Account Overview - ALWAYS VISIBLE */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-violet-600" />
                  Account Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium text-gray-800">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Recently'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {profile ? 'Completed' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account type</span>
                    <span className="font-medium text-gray-800">Pet Owner</span>
                  </div>
                </div>
              </div>

              {/* Location Info - ALWAYS VISIBLE if exists */}
              {profile && (profile.address || profile.city || profile.state || profile.pincode) && (
                <div className="p-6 border-b">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-violet-600" />
                    Location
                  </h3>
                  <div className="space-y-2">
                    {profile.address && (
                      <p className="text-gray-600 text-sm">{profile.address}</p>
                    )}
                    <p className="text-gray-800 font-medium">
                      {[profile.city, profile.state, profile.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/dashboard/owner/pets')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Home size={18} className="text-gray-600" />
                      <span className="text-gray-700">My Pets</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/owner/appointments')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-600" />
                      <span className="text-gray-700">My Appointments</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Tabs */}
              <div className="border-b flex">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditing(false);
                  }}
                  className={`px-6 py-4 text-sm font-medium transition-all relative ${
                    activeTab === 'profile'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    Profile Information
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('account');
                    setIsEditing(false);
                  }}
                  className={`px-6 py-4 text-sm font-medium transition-all relative ${
                    activeTab === 'account'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock size={18} />
                    Account Settings
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          {!profile 
                            ? 'Create Your Profile' 
                            : isEditing 
                              ? 'Edit Profile' 
                              : 'Profile Information'}
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          {!profile 
                            ? 'Fill in your details to get started' 
                            : isEditing 
                              ? 'Update your personal information' 
                              : 'Your complete profile details'}
                        </p>
                      </div>
                      
                      {/* Edit Button - Only shows when NOT editing and profile exists */}
                      {profile && !isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
                        >
                          <Edit size={16} />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {/* NO PROFILE - Create Form */}
                    {!profile && !isEditing && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User size={32} className="text-violet-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Profile Yet</h3>
                        <p className="text-gray-600 mb-6">Create your profile to get personalized pet care recommendations</p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          Create Profile
                        </button>
                      </div>
                    )}

                    {/* EDIT MODE - Form */}
                    {isEditing && (
                      <form onSubmit={handleSaveProfile} className="space-y-6">
                        {/* Profile Image URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Image URL
                          </label>
                          <input
                            type="url"
                            name="profileImageUrl"
                            value={profileForm.profileImageUrl}
                            onChange={handleProfileChange}
                            placeholder="https://example.com/your-image.jpg"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter a URL for your profile picture
                          </p>
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={profileForm.fullName}
                            onChange={handleProfileChange}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            required
                          />
                        </div>

                        {/* Bio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            rows="3"
                            value={profileForm.bio}
                            onChange={handleProfileChange}
                            placeholder="Tell us a little about yourself and your pets..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>

                        {/* Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={profileForm.address}
                            onChange={handleProfileChange}
                            placeholder="Street address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>

                        {/* City, State, Pincode Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={profileForm.city}
                              onChange={handleProfileChange}
                              placeholder="City"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={profileForm.state}
                              onChange={handleProfileChange}
                              placeholder="State"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pincode
                            </label>
                            <input
                              type="text"
                              name="pincode"
                              value={profileForm.pincode}
                              onChange={handleProfileChange}
                              placeholder="Pincode"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save size={18} />
                                {profile ? 'Update Profile' : 'Create Profile'}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* VIEW MODE - Display Profile Details (No Edit button visible) */}
                    {!isEditing && profile && (
                      <div className="space-y-6">
                        {/* Profile Details Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-violet-100 rounded-lg">
                                <User size={18} className="text-violet-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="font-semibold text-gray-800">{profile.fullName || 'Not provided'}</p>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail size={18} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Email Address</p>
                                <p className="font-semibold text-gray-800">{user?.email}</p>
                              </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Phone size={18} className="text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Phone Number</p>
                                <p className="font-semibold text-gray-800">{user?.phone || 'Not provided'}</p>
                              </div>
                            </div>

                            {/* Address */}
                            {profile.address && (
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                  <MapPin size={18} className="text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Address</p>
                                  <p className="font-semibold text-gray-800">{profile.address}</p>
                                </div>
                              </div>
                            )}

                            {/* City/State */}
                            {(profile.city || profile.state) && (
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <MapPin size={18} className="text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">City/State</p>
                                  <p className="font-semibold text-gray-800">
                                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                                    {profile.pincode && ` - ${profile.pincode}`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bio */}
                          {profile.bio && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-pink-100 rounded-lg">
                                  <User size={18} className="text-pink-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                                  <p className="text-gray-700 italic">"{profile.bio}"</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Success Message After Save */}
                        {success && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <span className="text-green-700 font-medium">{success}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Settings</h2>
                    
                    {/* Update Personal Info */}
                    <div className="mb-8 pb-8 border-b">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h3>
                      <form onSubmit={handleUpdateUser} className="space-y-4 max-w-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={userForm.name}
                            onChange={handleUserChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={userForm.email}
                            onChange={handleUserChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={userForm.phone}
                            onChange={handleUserChange}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Update Information
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Change Password */}
                    <div className="mb-8 pb-8 border-b">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                      
                      {!isChangingPassword ? (
                        <button
                          onClick={() => setIsChangingPassword(true)}
                          className="px-6 py-2 border border-violet-600 text-violet-600 rounded-lg hover:bg-violet-50 transition-all flex items-center gap-2"
                        >
                          <Lock size={18} />
                          Change Password
                        </button>
                      ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              minLength="6"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirm new password"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Resetting...
                                </>
                              ) : (
                                <>
                                  <Lock size={18} />
                                  Reset Password
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingPassword(false);
                                setPasswordForm({ newPassword: '', confirmPassword: '' });
                              }}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Account Actions */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Account Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
                              toast.warning('Profile deletion feature coming soon!', {
                                position: "top-right",
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                        >
                          <AlertCircle size={16} />
                          Delete Profile
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;