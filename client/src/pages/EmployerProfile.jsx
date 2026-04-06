import React, { useContext, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiGlobe, 
  FiUsers, 
  FiEdit3,
  FiSave,
  FiX,
  FiCamera,
  FiUpload
} from 'react-icons/fi';

const EmployerProfile = () => {
  console.log('EmployerProfile component rendering...');
  
  const { 
    companyData, 
    updateEmployerProfile, 
    getEmployerProfile,
    isLoading,
    error,
    backendUrl,
    companyToken // This is what we need for employer authentication
  } = useContext(AppContext);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    companySize: '',
    description: '',
    logo: '' // Add logo field
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Track if data has been loaded and component is mounted
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const abortControllerRef = useRef(null);

  // Cleanup function to cancel ongoing requests
  useEffect(() => {
    return () => {
      setIsMounted(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Initialize form data when companyData becomes available
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('EmployerProfile mounted successfully');
    console.log('backendUrl:', backendUrl);
    console.log('companyData:', companyData);
    console.log('companyData?.logo:', companyData?.logo);
    console.log('companyData?.image:', companyData?.image);
    console.log('companyToken exists:', !!companyToken);
    
    // Only initialize if we have companyData and haven't loaded data yet
    if (companyData && !dataLoaded) {
      const newFormData = {
        name: companyData.name || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        location: companyData.location || '',
        website: companyData.website || '',
        companySize: companyData.companySize || '',
        description: companyData.description || '',
        logo: companyData.logo || ''
      };
      
      setFormData(newFormData);
      
      // Set logo preview with URL encoding for spaces
      if (companyData.logo) {
        const logoPath = companyData.logo.startsWith('/') 
          ? companyData.logo.substring(1) 
          : companyData.logo;
        
        // Encode the filename part to handle spaces
        const pathParts = logoPath.split('/');
        const filename = pathParts[pathParts.length - 1];
        const encodedFilename = encodeURIComponent(filename);
        const directory = pathParts.slice(0, -1).join('/');
        
        const previewUrl = directory 
          ? `${backendUrl}/${directory}/${encodedFilename}`
          : `${backendUrl}/${encodedFilename}`;
        
        setLogoPreview(previewUrl);
        console.log('Logo preview set to:', previewUrl);
      } else {
        setLogoPreview(null);
      }
      
      setDataLoaded(true);
      console.log('Form data initialized with:', newFormData);
    }
  }, [companyData, dataLoaded, isMounted, companyToken, backendUrl]);

  // Fetch profile data on component mount if not available and company is authenticated
  useEffect(() => {
    if (!isMounted) return;
    
    // Only fetch if we have a company token (employer is logged in) but no company data
    if (companyToken && !companyData && getEmployerProfile && !isLoading) {
      console.log('Fetching employer profile...');
      
      // Call the API with error handling
      const fetchProfile = async () => {
        try {
          await getEmployerProfile();
        } catch (error) {
          // Only show error if component is still mounted and company is authenticated
          if (isMounted && companyToken) {
            console.error('Failed to fetch profile:', error);
            // Don't show toast error for 401 during logout
            if (error.response?.status !== 401) {
              toast.error('Failed to load profile data');
            }
          }
        }
      };
      
      fetchProfile();
    }
  }, [companyData, getEmployerProfile, isLoading, isMounted, companyToken]);

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleLogoClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field, value) => {
    if (!isMounted || !companyToken) return;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!isMounted || !companyToken) return;
    
    if (!formData.name.trim()) {
        toast.error('Company name is required');
        return;
    }
    
    if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
    }

    // Prepare profile data
    const profileData = new FormData();
    profileData.append('name', formData.name.trim());
    profileData.append('email', formData.email.trim());
    profileData.append('phone', formData.phone.trim());
    profileData.append('location', formData.location.trim());
    profileData.append('website', formData.website.trim());
    profileData.append('companySize', formData.companySize.trim());
    profileData.append('description', formData.description.trim());
    
    // Add logo if a new file was selected
    if (logoFile) {
      profileData.append('logo', logoFile);
    }

    console.log('Saving profile data with logo');
    
    try {
      const result = await updateEmployerProfile(profileData);
      
      if (result && result.success && isMounted) {
          setIsEditing(false);
          setLogoFile(null); // Clear the file after successful save
          console.log('Profile updated successfully');
      }
    } catch (error) {
      if (isMounted && companyToken) {
        console.error('Failed to update profile:', error);
        toast.error('Failed to update profile');
      }
    }
  };

  const handleCancel = () => {
    if (!isMounted) return;
    
    // Reset form fields to current data from companyData
    if (companyData) {
      const resetData = {
        name: companyData.name || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        location: companyData.location || '',
        website: companyData.website || '',
        companySize: companyData.companySize || '',
        description: companyData.description || '',
        logo: companyData.logo || ''
      };
      setFormData(resetData);
      setLogoPreview(companyData.logo || null);
      setLogoFile(null);
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!isMounted || !companyToken) return;
    setIsEditing(true);
  };

  // Helper function to get display value (shows saved data or placeholder)
  const getDisplayValue = (field) => {
    if (isEditing) {
      return formData[field];
    }
    // For display mode, show the actual saved value from companyData or fallback
    return companyData?.[field] || formData[field] || 'Not provided';
  };

  // Helper function to get placeholder text
  const getPlaceholder = (field) => {
    const placeholders = {
      name: 'Enter company name',
      email: 'Enter email',
      phone: 'Enter phone',
      location: 'Enter location',
      website: 'Enter website',
      companySize: 'e.g., 1-10, 50-100, 200+',
      description: 'Tell us about your company...'
    };
    return placeholders[field] || `Enter ${field}`;
  };

  // Get initials from name (e.g. "Afroz Malek" → "AM")
  const getInitials = (name) => {
    if (!name || name === 'Not provided') return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Get logo URL for display
  const getLogoUrl = () => {
    console.log('=== GET LOGO URL DEBUG ===');
    console.log('logoPreview:', logoPreview);
    console.log('companyData?.logo:', companyData?.logo);
    console.log('companyData?.image:', companyData?.image);
    console.log('backendUrl:', backendUrl);
    
    // If there's a preview (during edit), use it
    if (logoPreview) {
      console.log('Using logoPreview:', logoPreview);
      return logoPreview;
    }
    
    // Check if there's a logo in companyData
    if (companyData?.logo) {
      // If logo is a full URL (starts with http), use it directly
      if (companyData.logo.startsWith('http')) {
        console.log('Logo is full URL:', companyData.logo);
        return companyData.logo;
      }
      // Otherwise, construct the URL with backend
      // Remove leading slash if present to avoid double slashes
      const logoPath = companyData.logo.startsWith('/') 
        ? companyData.logo.substring(1) 
        : companyData.logo;
      
      // Split path and filename, encode the filename part to handle spaces
      const pathParts = logoPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      const encodedFilename = encodeURIComponent(filename);
      const directory = pathParts.slice(0, -1).join('/');
      
      const fullUrl = directory 
        ? `${backendUrl}/${directory}/${encodedFilename}`
        : `${backendUrl}/${encodedFilename}`;
      
      console.log('Constructed logo URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback to company image if no logo
    if (companyData?.image) {
      console.log('Using fallback company image:', companyData.image);
      return companyData.image;
    }
    
    console.log('No logo found, returning null');
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
    
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          {/* Logo/Avatar Section */}
          <div className="relative">
            {(() => {
              const logoUrl = getLogoUrl();
              console.log('Rendering with logoUrl:', logoUrl);
              return logoUrl ? (
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-4 border-white">
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', logoUrl);
                      console.error('Error event:', e);
                    }}
                    onLoad={() => console.log('Image loaded successfully:', logoUrl)}
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                  style={{ backgroundColor: '#ff6666' }}
                >
                  {getInitials(getDisplayValue('name'))}
                </div>
              );
            })()}
            
            
            {/* Edit Logo Button (only visible in edit mode) */}
            {isEditing && (
              <button
                onClick={handleLogoClick}
                className="absolute -bottom-1 -right-1 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Upload logo"
              >
                <FiCamera className="text-sm" />
              </button>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {getDisplayValue('name') !== 'Not provided' ? getDisplayValue('name') : 'Company Name'}
            </h1>
            <p className="text-gray-600 mt-1">Company Profile</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Active Recruiter</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading || !companyToken}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <FiSave className="text-sm" />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={!companyToken}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <FiX className="text-sm" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              disabled={!companyToken}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <FiEdit3 className="text-sm" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Logo Upload Section (visible only in edit mode) */}
      {isEditing && logoPreview && (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiUpload className="text-red-500 text-lg" />
              <span className="text-sm font-semibold text-gray-700">Company Logo</span>
            </div>
            <button
              onClick={handleRemoveLogo}
              className="text-red-500 hover:text-red-600 text-sm font-medium"
            >
              Remove Logo
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Recommended: Square image, max 5MB (PNG, JPG, JPEG)
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      )}

      {/* Company Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiUser className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Company Name</label>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('name')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('name')}</p>
          )}
        </div>
        
        {/* Email */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiMail className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Email</label>
          </div>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('email')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('email')}</p>
          )}
        </div>

        {/* Phone */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiPhone className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Phone</label>
          </div>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('phone')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('phone')}</p>
          )}
        </div>

        {/* Location */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiMapPin className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Location</label>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('location')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('location')}</p>
          )}
        </div>

        {/* Website */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiGlobe className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Website</label>
          </div>
          {isEditing ? (
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('website')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('website')}</p>
          )}
        </div>

        {/* Company Size */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center gap-3 mb-2">
            <FiUsers className="text-red-500 text-lg" />
            <label className="text-sm font-semibold text-gray-700">Company Size</label>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={formData.companySize}
              onChange={(e) => handleInputChange('companySize', e.target.value)}
              disabled={!companyToken}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
              placeholder={getPlaceholder('companySize')}
            />
          ) : (
            <p className="text-gray-800 font-medium">{getDisplayValue('companySize')}</p>
          )}
        </div>
      </div>

      {/* Company Description */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="flex items-center gap-3 mb-4">
          <FiUser className="text-red-500 text-lg" />
          <h2 className="text-lg font-semibold text-gray-700">Company Description</h2>
        </div>
        {isEditing ? (
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={!companyToken}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:opacity-50"
            rows="5"
            placeholder={getPlaceholder('description')}
          />
        ) : (
          <p className="text-gray-800 leading-relaxed">
            {getDisplayValue('description') !== 'Not provided' 
              ? getDisplayValue('description') 
              : 'No description provided yet. Click edit to add a company description.'}
          </p>
        )}
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.activeJobs || 0}</h3>
            <p className="text-gray-600 mt-1">Active Jobs</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.totalApplications || 0}</h3>
            <p className="text-gray-600 mt-1">Applications</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.totalHired || 0}</h3>
            <p className="text-gray-600 mt-1">Hired / accepted</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployerProfile;