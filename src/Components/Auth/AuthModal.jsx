import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Google as GoogleIcon,
  PhotoCamera,
} from '@mui/icons-material';

const AuthModal = ({ open, onClose, onLoginSuccess = () => {} }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState("candidate");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    companyName: "",
    website: "",
  });

  // Timer effect for OTP resend
  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (e) => {
    setUserRole(e.target.value);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOtp = () => {
    if (!formData.phone) {
      alert("Please enter your mobile number");
      return;
    }
    // Simulate OTP sending
    console.log("Sending OTP to:", formData.phone);
    setOtpSent(true);
    setTimer(30); // 30 seconds timer
    alert(`OTP sent to ${formData.phone}`);
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    // Simulate OTP verification
    console.log("Verifying OTP:", otp);
    if (otp === "1234") { // Demo OTP
      setShowOtpVerification(false);
      alert("Mobile number verified successfully!");
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleResendOtp = () => {
    if (timer === 0) {
      handleSendOtp();
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In initiated");
    
    // Simulate successful Google authentication
    const googleUserData = {
      firstName: "Google",
      lastName: "User",
      email: "user@gmail.com",
      username: "googleuser123",
      phone: "+91 4544565656",
      role: "candidate",
      profileImage: "https://via.placeholder.com/150/FF0000/FFFFFF?text=GU",
      authMethod: "google"
    };
    
    // Call the callback function  
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(googleUserData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Login submitted:", {
        emailOrPhone: formData.email,
        password: formData.password,
      });
      // Simulate successful login
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: formData.email || "john.doe@example.com",
        username: "johndoe123",
        phone: "+91 99999 88888",
        role: "candidate",
        profileImage: "https://via.placeholder.com/150/FF0000/FFFFFF?text=JD",
        authMethod: "email"
      };
      
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(userData);
      }
    } else {
      // For signup, first verify mobile number
      if (!otpSent) {
        alert("Please verify your mobile number first");
        return;
      }
      
      console.log("Signup submitted:", {
        ...formData,
        role: userRole,
        mobileVerified: true,
        profileImage: profileImage
      });
      
      // Simulate successful registration
      const newUserData = {
        ...formData,
        role: userRole,
        profileImage: profileImagePreview || `https://via.placeholder.com/150/FF0000/FFFFFF?text=${(formData.firstName[0] || 'U')}${(formData.lastName[0] || 'U')}`,
        authMethod: "email"
      };
      
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(newUserData);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      companyName: "",
      website: "",
    });
    setOtp("");
    setOtpSent(false);
    setShowOtpVerification(false);
    setTimer(0);
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'white',
          color: '#333',
          // boxShadow: '0 20px 40px rgba(255, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2" sx={{ color: '#333', fontWeight: 'bold' }}>
            {isLogin ? "Welcome Back" : "Join Us"}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#FF0000' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ background: 'transparent' }}>
        <form onSubmit={handleSubmit}>
          {/* Google Sign In Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            sx={{
              mb: 3,
              py: 1.5,
              borderColor: '#FF0000',
              color: '#FF0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                color: '#cc0000',
              },
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          </Button>

          <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
            <Divider sx={{ flex: 1, bgcolor: '#ddd' }} />
            <Typography variant="body2" sx={{ mx: 2, color: '#666' }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1, bgcolor: '#ddd' }} />
          </Box>

          {/* Login Form */}
          {isLogin ? (
            <Box>
              <TextField
                fullWidth
                label="Email or Phone Number"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#333',
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#FF0000' },
                    '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                  },
                  '& .MuiInputLabel-root': { color: '#666' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#333',
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#FF0000' },
                    '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                  },
                  '& .MuiInputLabel-root': { color: '#666' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                }}
              />
              <Box mt={1} mb={2}>
                <Link
                  href="#"
                  variant="body2"
                  sx={{ textDecoration: "none", color: '#FF0000' }}
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Forgot password functionality will be implemented");
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  py: 1.5,
                  backgroundColor: '#FF0000',
                  color: 'white',
                  '&:hover': { backgroundColor: '#cc0000' },
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Sign In
              </Button>
            </Box>
          ) : (
            /* Signup Form */
            <Box>
              {/* Profile Photo Upload */}
              <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
                <Box position="relative">
                  <Avatar
                    src={profileImagePreview}
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: '#FF0000',
                      border: '3px solid #FF0000',
                      color: 'white'
                    }}
                  >
                    {!profileImagePreview && <PhotoCamera sx={{ fontSize: 40 }} />}
                  </Avatar>
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      backgroundColor: '#FF0000',
                      color: 'white',
                      width: 35,
                      height: 35,
                      '&:hover': { backgroundColor: '#cc0000' },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 18 }} />
                  </IconButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" textAlign="center" sx={{ color: '#666', mb: 2 }}>
                Upload Profile Photo
              </Typography>

              {/* Role Selection */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel sx={{ color: '#666', '&.Mui-focused': { color: '#FF0000' } }}>
                  Role
                </InputLabel>
                <Select
                  value={userRole}
                  label="Role"
                  onChange={handleRoleChange}
                  sx={{
                    color: '#333',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FF0000' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF0000' },
                    '& .MuiSvgIcon-root': { color: '#666' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'white',
                        '& .MuiMenuItem-root': {
                          color: '#333',
                          '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
                          '&.Mui-selected': { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="candidate">Candidate</MenuItem>
                  <MenuItem value="employer">Employer</MenuItem>
                </Select>
              </FormControl>

              {/* Common Fields */}
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333',
                      '& fieldset': { borderColor: '#ddd' },
                      '&:hover fieldset': { borderColor: '#FF0000' },
                      '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333',
                      '& fieldset': { borderColor: '#ddd' },
                      '&:hover fieldset': { borderColor: '#FF0000' },
                      '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                  }}
                />
              </Box>

              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#333',
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#FF0000' },
                    '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                  },
                  '& .MuiInputLabel-root': { color: '#666' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#333',
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#FF0000' },
                    '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                  },
                  '& .MuiInputLabel-root': { color: '#666' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                }}
              />

              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  variant="outlined"
                  placeholder="+91 XXXXX XXXXX"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333',
                      '& fieldset': { borderColor: '#ddd' },
                      '&:hover fieldset': { borderColor: '#FF0000' },
                      '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleSendOtp}
                  disabled={!formData.phone || otpSent}
                  sx={{ 
                    mt: 1, 
                    minWidth: 100,
                    height: 56,
                    borderColor: "#FF0000",
                    color: "#FF0000",
                    "&:hover": {
                      borderColor: "#cc0000",
                      backgroundColor: "rgba(255, 0, 0, 0.1)"
                    },
                    "&.Mui-disabled": {
                      borderColor: "#ccc",
                      color: "#999"
                    }
                  }}
                >
                  {otpSent ? "Sent" : "Send OTP"}
                </Button>
              </Box>

              {/* OTP Verification Section */}
              {otpSent && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: "#f9f9f9", 
                  borderRadius: 2,
                  border: '1px solid #ddd'
                }}>
                  <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                    OTP sent to {formData.phone}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      variant="outlined"
                      size="small"
                      inputProps={{ maxLength: 6 }}
                      sx={{ 
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                          color: '#333',
                          '& fieldset': { borderColor: '#ddd' },
                          '&:hover fieldset': { borderColor: '#FF0000' },
                          '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                        },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyOtp}
                      size="small"
                      sx={{ 
                        backgroundColor: "#FF0000",
                        color: 'white',
                        "&:hover": { backgroundColor: "#cc0000" }
                      }}
                    >
                      Verify
                    </Button>
                  </Box>
                  <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive OTP?"}
                    </Typography>
                    {timer === 0 && (
                      <Button
                        size="small"
                        onClick={handleResendOtp}
                        sx={{ color: "#FF0000" }}
                      >
                        Resend OTP
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: '#999' }}>
                    Demo: Use OTP "1234" for verification
                  </Typography>
                </Box>
              )}

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#333',
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#FF0000' },
                    '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                  },
                  '& .MuiInputLabel-root': { color: '#666' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                }}
              />

              {/* Employer-specific fields */}
              {userRole === "employer" && (
                <>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#333',
                        '& fieldset': { borderColor: '#ddd' },
                        '&:hover fieldset': { borderColor: '#FF0000' },
                        '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                      },
                      '& .MuiInputLabel-root': { color: '#666' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Website (Optional)"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    placeholder="https://www.example.com"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#333',
                        '& fieldset': { borderColor: '#ddd' },
                        '&:hover fieldset': { borderColor: '#FF0000' },
                        '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                      },
                      '& .MuiInputLabel-root': { color: '#666' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#FF0000' },
                    }}
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  py: 1.5,
                  backgroundColor: '#FF0000',
                  color: 'white',
                  '&:hover': { backgroundColor: '#cc0000' },
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Create Account
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2, bgcolor: '#ddd' }} />

          {/* Switch between Login/Signup */}
          <Box textAlign="center">
            <Typography variant="body2" sx={{ color: '#666' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                href="#"
                variant="body2"
                sx={{ 
                  textDecoration: "none", 
                  fontWeight: "bold",
                  color: '#FF0000',
                  '&:hover': { color: '#cc0000' }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  switchMode();
                }}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </Link>
            </Typography>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;