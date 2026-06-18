import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Award, 
  GraduationCap, 
  FileText, 
  BriefcaseMedical, 
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  EyeOff,
  ChevronRight,
  Lock,
  Info,
  HospitalIcon,
  WorkflowIcon,
  Shield,
  Download,
  File,
  XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/api';

const Profile = () => {
  const vetId = localStorage.getItem('userId');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    qualification: '',
    specialization: 'General Veterinary',
    hospitalName: '',
    experienceYears: 0,
    licenseNumber: '',
    consultationFee: 500,
    bio: ''
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch vet profile and user data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user info
        const userRes = await api.get(`/users/${vetId}`);
        setUserData({
          name: userRes.data.name,
          email: userRes.data.email,
          phone: userRes.data.phone
        });

        // Try to fetch vet profile
        try {
          const profileRes = await api.get(`/vets/profile/${vetId}`);
          if (profileRes.data) {
            setProfile(profileRes.data);
            setFormData({
              qualification: profileRes.data.qualification || '',
              specialization: profileRes.data.specialization || 'General Veterinary',
              hospitalName: profileRes.data.hospitalName || '',
              experienceYears: profileRes.data.experienceYears || 0,
              licenseNumber: profileRes.data.licenseNumber || '',
              consultationFee: profileRes.data.consultationFee || 500,
              bio: profileRes.data.bio || ''
            });
          }
        } catch (error) {
          // Profile doesn't exist - this is okay
          console.log('No existing profile found, showing creation form');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vetId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experienceYears' || name === 'consultationFee' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    // Validate required fields for profile creation
    if (!profile && (!formData.qualification || !formData.hospitalName || !formData.licenseNumber)) {
      toast.error('Please fill all required fields: Qualification, Hospital Name, and License Number');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/vets/profile/${vetId}`, formData);
      
      setProfile(response.data);
      setEditing(false);
      toast.success(profile ? 'Profile updated successfully!' : 'Profile created successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async () => {
    if (!userData.name || !userData.phone) {
      toast.error("Name and phone are required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(userData.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      
      const res = await api.put(`/users/${vetId}`, {
        name: userData.name,
        phone: userData.phone
      });

      console.log('Update successful:', res.data);
      toast.success('Personal information updated successfully!');
      setShowPersonalInfo(false);
    } catch (error) {
      console.error('Error updating user info:', error);
      toast.error('Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      // First verify current password by attempting login
      const loginRes = await api.post('/users/login', {
        email: userData.email,
        password: passwordData.currentPassword
      });

      if (loginRes.data) {
        // If current password is correct, update to new password
        await api.put(`/users/${vetId}/reset-password?password=${passwordData.newPassword}`);
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Password updated successfully!');
        setShowPasswordChange(false);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.response?.status === 409) {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async () => {
    if (window.confirm('Are you sure you want to delete your veterinary profile? This action cannot be undone.')) {
      try {
        setLoading(true);
        await api.delete(`/vets/profile/${vetId}`);
        setProfile(null);
        setFormData({
          qualification: '',
          specialization: 'General Veterinary',
          hospitalName: '',
          experienceYears: 0,
          licenseNumber: '',
          consultationFee: 500,
          bio: ''
        });
        toast.success('Veterinary profile deleted successfully');
      } catch (error) {
        console.error('Error deleting profile:', error);
        toast.error(error.response?.data || 'Failed to delete profile');
      } finally {
        setLoading(false);
      }
    }
  };

  const specializations = [
    'General Veterinary',
    'Surgery',
    'Dermatology',
    'Internal Medicine',
    'Dentistry',
    'Ophthalmology',
    'Cardiology',
    'Neurology',
    'Oncology',
    'Emergency & Critical Care',
    'Behavioral Medicine',
    'Alternative Medicine'
  ];

  if (loading && !editing && !showPersonalInfo && !showPasswordChange) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Veterinary Profile</h1>
          <p className="text-gray-600">
            {profile 
              ? "Manage your professional profile and information"
              : "Complete your veterinary profile to start accepting appointments"}
          </p>
        </div>

        {/* Profile Status Banner */}
        <div className={`mb-8 rounded-xl p-4 ${profile ? 'bg-emerald-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {profile ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p className="font-medium text-gray-800">
                {profile ? ' Your veterinary profile is complete and visible to pet owners' : '⚠️ Complete your profile to start accepting appointments'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Preview Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Profile Preview</h2>
              <p className="text-sm text-gray-500">This is how pet owners see your profile</p>
            </div>
            {profile && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 pt-5">{userData.name}</h3>
                  
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Award className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Qualification</p>
                      <p className="font-medium text-gray-800">{formData.qualification}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium text-gray-800">{formData.experienceYears} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <WorkflowIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Specialization</p>
                      <p className="font-medium text-gray-800">{formData.specialization} </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-medium text-gray-800">{formData.licenseNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Consultation Fee</p>
                      <p className="font-medium text-gray-800">₹{formData.consultationFee}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <HospitalIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Clinic Name</p>
                      <p className="font-medium text-gray-800">{formData.hospitalName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {formData.bio && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">About Me</h4>
                  <p className="text-gray-600">{formData.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Profile Created Yet</h3>
              <p className="text-gray-600 mb-6">Create your veterinary profile below to start accepting appointments</p>
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Profile
              </button>
            </div>
          )}
        </div>
          
        {/* Profile Form (only shows when editing or no profile exists) */}
        {(editing || !profile) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {profile ? 'Edit Professional Profile' : 'Create Professional Profile'}
                </h2>
                <p className="text-sm text-gray-500">
                  {profile 
                    ? 'Update your professional information'
                    : 'Fill in your professional details to create your profile'}
                </p>
              </div>
              {profile && (
                <button
                  onClick={() => setEditing(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Qualification */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    Qualification *
                  </div>
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., BVSc, MVSc, PhD"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <BriefcaseMedical className="w-4 h-4 text-gray-500" />
                    Specialization
                  </div>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Experience (Years)
                  </div>
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Hospital Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    Hospital/Clinic Name *
                  </div>
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  placeholder="e.g., City Veterinary Hospital"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* License Number */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    License Number *
                  </div>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., VET123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Consultation Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    Consultation Fee (₹)
                  </div>
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Professional Bio
                  </div>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell pet owners about your expertise, approach, and experience..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={saveProfile}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {profile ? 'Save Changes' : 'Create Profile'}
              </button>
              
              {profile && (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteProfile}
                    className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete Profile
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Settings Section */}
        <div className="space-y-4 mb-8">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPersonalInfo(!showPersonalInfo)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Personal Information</h3>
                  <p className="text-sm text-gray-500">Update your name and contact details</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPersonalInfo ? 'rotate-90' : ''}`} />
            </button>
            
            {showPersonalInfo && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleUserInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Email Address
                      </div>
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={userData.phone}
                      onChange={handleUserInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      pattern="[6-9][0-9]{9}"
                      title="Enter a valid Indian phone number"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowPersonalInfo(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateUserInfo}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Information'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Change Password</h3>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordChange ? 'rotate-90' : ''}`} />
            </button>
            
            {showPasswordChange && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updatePassword}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Viewer Component - Added at the end */}
        {profile && <VetCertificates vetId={vetId} />}
      </div>
    </div>
  );
};

// Certificate Viewer Component - Only added at the end, no changes to existing code
const VetCertificates = ({ vetId }) => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState({
    degreeCertificate: null,
    medicalRegistrationCertificate: null,
    identityProof: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, [vetId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vets/profile/${vetId}`);
      
      if (response.data) {
        setCertificates({
          degreeCertificate: response.data.degreeCertificateUrl || null,
          medicalRegistrationCertificate: response.data.medicalRegistrationCertificateUrl || null,
          identityProof: response.data.identityProofUrl || null
        });
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-pet-wellness-management-system.onrender.com";

const handleViewCertificate = (url, title) => {
  if (url) {
    setPreviewUrl(`${BASE_URL}${url}`);
    setPreviewTitle(title);
  }
};

  const getCertificateIcon = (type) => {
    switch(type) {
      case 'degree':
        return <GraduationCap className="w-8 h-8" />;
      case 'medical':
        return <Shield className="w-8 h-8" />;
      case 'identity':
        return <FileText className="w-8 h-8" />;
      default:
        return <File className="w-8 h-8" />;
    }
  };

  const getCertificateLabel = (key) => {
    switch(key) {
      case 'degreeCertificate':
        return { 
          title: 'Degree Certificate', 
          type: 'degree',
          description: 'BVSc, MVSc or other veterinary degrees'
        };
      case 'medicalRegistrationCertificate':
        return { 
          title: 'Medical Registration', 
          type: 'medical',
          description: 'Veterinary council registration'
        };
      case 'identityProof':
        return { 
          title: 'Identity Proof', 
          type: 'identity',
          description: 'Government ID verification'
        };
      default:
        return { title: key, type: 'file', description: '' };
    }
  };

  const hasCertificates = Object.values(certificates).some(url => url !== null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Professional Certificates</h3>
              <p className="text-sm text-gray-600">
                {hasCertificates 
                  ? 'Verified documents and certifications'
                  : 'No certificates uploaded yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasCertificates ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">No Certificates Found</h4>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Your professional certificates and documents will appear here once uploaded
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(certificates).map(([key, url]) => {
                if (!url) return null;
                
                const { title, type, description } = getCertificateLabel(key);
                const fileName = url.split('/').pop();
                
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        {getCertificateIcon(type)}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h4 className="font-medium text-gray-800 flex items-center gap-2">
                          {title}
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Verified
                          </span>
                        </h4>
                        <p className="text-sm text-gray-500 mb-1">{description}</p>
                        <p className="text-xs text-gray-400">
                          {fileName?.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewCertificate(url, title)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Certificate"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Verification Badge */}
          {hasCertificates && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">All documents are verified and secure</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                These documents have been verified by our team
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">{previewTitle}</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 h-[70vh]">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border border-gray-200"
                title={previewTitle}
              />
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;