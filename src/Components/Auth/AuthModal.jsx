// AuthModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";

import { Close as CloseIcon } from "@mui/icons-material";
import "./AuthModal.css";

const AuthModal = ({ open, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState("candidate");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Login submitted:", {
        emailOrPhone: formData.email,
        password: formData.password,
      });
      // Add your authentication logic here
      onClose();
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
      });
      // Add your registration logic here
      onClose();
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
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2">
            {isLogin ? "Login" : "Sign Up"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit}>
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
              />
              <Box mt={1} mb={2}>
                <Link
                  href="#"
                  variant="body2"
                  sx={{ textDecoration: "none" }}
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
                sx={{ mt: 2, mb: 2 }}
              >
                Sign In
              </Button>
            </Box>
          ) : (
            /* Signup Form */
            <Box>
              {/* Role Selection */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userRole}
                  label="Role"
                  onChange={handleRoleChange}
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
                />
                <Button
                  variant="outlined"
                  onClick={handleSendOtp}
                  disabled={!formData.phone || otpSent}
                  sx={{ 
                    mt: 1, 
                    minWidth: 100,
                    height: 56,
                    borderColor: "#ff0000",
                    color: "#ff0000",
                    "&:hover": {
                      borderColor: "#cc0000",
                      backgroundColor: "rgba(255, 0, 0, 0.04)"
                    }
                  }}
                >
                  {otpSent ? "Sent" : "Send OTP"}
                </Button>
              </Box>

              {/* OTP Verification Section */}
              {otpSent && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: "#f9f9f9", borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
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
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyOtp}
                      size="small"
                      sx={{ 
                        backgroundColor: "#022030",
                        "&:hover": { backgroundColor: "#011820" }
                      }}
                    >
                      Verify
                    </Button>
                  </Box>
                  <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="textSecondary">
                      {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive OTP?"}
                    </Typography>
                    {timer === 0 && (
                      <Button
                        size="small"
                        onClick={handleResendOtp}
                        sx={{ color: "#ff0000" }}
                      >
                        Resend OTP
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
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
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Switch between Login/Signup */}
          <Box textAlign="center">
            <Typography variant="body2">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                href="#"
                variant="body2"
                sx={{ textDecoration: "none", fontWeight: "bold" }}
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