import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PhotoCamera,
  Upload,
  Download,
  Edit,
  Work,
  Email,
  Phone,
  Language,
  Business,
} from '@mui/icons-material';

const ProfilePage = ({ userData = {}, onLogout = () => {} }) => {
  const [profileImage, setProfileImage] = useState(userData?.profileImage || "https://via.placeholder.com/150/FF0000/FFFFFF?text=USER");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const profileImageRef = useRef(null);
  const resumeFileRef = useRef(null);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is PDF or DOC
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setResumeFile(file);
        setResumeUploaded(true);
        alert(`Resume "${file.name}" uploaded successfully!`);
      } else {
        alert('Please upload a PDF or Word document');
      }
    }
  };

  const handleDownloadResume = () => {
    if (resumeFile) {
      // Create download link
      const url = URL.createObjectURL(resumeFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const profileCompleteness = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const completedFields = requiredFields.filter(field => userData?.[field]);
    let percentage = (completedFields.length / requiredFields.length) * 100;
    
    // Add bonus for profile image and resume
    if (profileImage && !profileImage.includes('placeholder')) {
      percentage += 10;
    }
    if (resumeUploaded) {
      percentage += 10;
    }
    
    return Math.min(Math.round(percentage), 100);
  };

  return (
    <Box sx={{ 
        
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffffff1e 0%, #f8f9fa53 100%)',
      py: 4,
      px: 2,
      paddingTop:10
    }}>
      <Box maxWidth="lg" mx="auto">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }}>
            My Profile
          </Typography>
          <Button
            variant="outlined"
            onClick={onLogout}
            sx={{
              borderColor: '#FF0000',
              color: '#FF0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              },
            }}
          >
            Logout
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box position="relative" display="inline-block" sx={{ mb: 2 }}>
                  <Avatar
                    src={profileImage}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto',
                      border: '4px solid #FF0000',
                      mb: 2
                    }}
                  />
                  <IconButton
                    onClick={() => profileImageRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      backgroundColor: '#FF0000',
                      color: 'white',
                      width: 40,
                      height: 40,
                      '&:hover': { backgroundColor: '#cc0000' },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 20 }} />
                  </IconButton>
                  <input
                    type="file"
                    ref={profileImageRef}
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                  />
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  {userData?.firstName} {userData?.lastName}
                </Typography>
                
                <Chip 
                  label={userData?.role || 'Candidate'} 
                  sx={{ 
                    backgroundColor: '#FF0000', 
                    color: 'white',
                    mb: 2,
                    textTransform: 'capitalize'
                  }} 
                />

                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  @{userData?.username}
                </Typography>

                {/* Profile Completeness */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Profile Completeness
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={profileCompleteness()} 
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#FF0000',
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#FF0000', mt: 1, display: 'block', fontWeight: 'bold' }}>
                    {profileCompleteness()}% Complete
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  fullWidth
                  sx={{
                    backgroundColor: '#FF0000',
                    color: 'white',
                    '&:hover': { backgroundColor: '#cc0000' },
                    py: 1.5,
                  }}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Resume Upload Card */}
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 3,
              mt: 3,
              boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                  Resume
                </Typography>
                
                {!resumeUploaded ? (
                  <Box 
                    sx={{ 
                      border: '2px dashed #FF0000', 
                      borderRadius: 2, 
                      p: 3, 
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { 
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.05)'
                      },
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => resumeFileRef.current?.click()}
                  >
                    <Upload sx={{ fontSize: 48, color: '#FF0000', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      Click to upload your resume
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      PDF, DOC, DOCX up to 10MB
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Paper 
                      sx={{ 
                        backgroundColor: '#f8f9fa', 
                        p: 3, 
                        borderRadius: 2,
                        border: '2px solid #FF0000',
                        mb: 2
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ 
                            backgroundColor: '#FF0000', 
                            borderRadius: 1, 
                            p: 1.5, 
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              PDF
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                              {resumeFile?.name || 'My_Resume.pdf'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Uploaded • {resumeFile?.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : '2.5 MB'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={handleDownloadResume}
                          sx={{
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            color: '#FF0000',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
                          }}
                        >
                          <Download />
                        </IconButton>
                      </Box>
                    </Paper>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Upload />}
                      onClick={() => resumeFileRef.current?.click()}
                      sx={{
                        borderColor: '#FF0000',
                        color: '#FF0000',
                        '&:hover': {
                          borderColor: '#cc0000',
                          backgroundColor: 'rgba(255, 0, 0, 0.05)',
                        },
                      }}
                    >
                      Upload New Resume
                    </Button>
                  </Box>
                )}

                <input
                  type="file"
                  ref={resumeFileRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Personal Information Card */}
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 3,
              mb: 3,
              boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Personal Information
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    sx={{
                      borderColor: '#FF0000',
                      color: '#FF0000',
                      '&:hover': {
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      },
                    }}
                  >
                    Edit
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: '#FF0000', 
                        borderRadius: 1, 
                        p: 1, 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        height: 40,
                      }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          FN
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          First Name
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                          {userData?.firstName || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: '#FF0000', 
                        borderRadius: 1, 
                        p: 1, 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        height: 40,
                      }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          LN
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Last Name
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                          {userData?.lastName || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Email sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Email
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                          {userData?.email || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Phone sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Phone
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                          {userData?.phone || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Work sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Role
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {userData?.role || 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: '#FF0000', 
                        borderRadius: 1, 
                        p: 1, 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        height: 40,
                      }}>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                          @
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Username
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                          {userData?.username || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Employer specific fields */}
                  {userData?.role === 'employer' && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <Business sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Company Name
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                              {userData?.companyName || 'Not provided'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <Language sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Website
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                              {userData?.website || 'Not provided'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Resume Section */}
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 3,
              mb: 3,
              boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Resume & Documents
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Upload />}
                    onClick={() => resumeFileRef.current?.click()}
                    sx={{
                      borderColor: '#FF0000',
                      color: '#FF0000',
                      '&:hover': {
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      },
                    }}
                  >
                    Upload Resume
                  </Button>
                </Box>

                {!resumeUploaded ? (
                  <Box 
                    sx={{ 
                      border: '2px dashed #FF0000', 
                      borderRadius: 2, 
                      p: 4, 
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { 
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.05)'
                      },
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => resumeFileRef.current?.click()}
                  >
                    <Upload sx={{ fontSize: 64, color: '#FF0000', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#333', mb: 1, fontWeight: 'bold' }}>
                      Upload Your Resume
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Drag and drop your resume here, or click to browse
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                      Supported formats: PDF, DOC, DOCX (Max 10MB)
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Paper 
                      sx={{ 
                        backgroundColor: '#f8f9fa', 
                        p: 3, 
                        borderRadius: 2,
                        border: '2px solid #FF0000',
                        mb: 2
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ 
                            backgroundColor: '#FF0000', 
                            borderRadius: 1, 
                            p: 1.5, 
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              PDF
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                              {resumeFile?.name || 'My_Resume.pdf'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Uploaded • {resumeFile?.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : '2.5 MB'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={handleDownloadResume}
                          sx={{
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            color: '#FF0000',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
                          }}
                        >
                          <Download />
                        </IconButton>
                      </Box>
                    </Paper>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Upload />}
                      onClick={() => resumeFileRef.current?.click()}
                      sx={{
                        borderColor: '#FF0000',
                        color: '#FF0000',
                        '&:hover': {
                          borderColor: '#cc0000',
                          backgroundColor: 'rgba(255, 0, 0, 0.05)',
                        },
                      }}
                    >
                      Upload New Resume
                    </Button>
                  </Box>
                )}

                <input
                  type="file"
                  ref={resumeFileRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats & Actions */}
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
                  Account Overview
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ color: '#FF0000', fontWeight: 'bold' }}>
                        {profileCompleteness()}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Profile Complete
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ color: '#FF0000', fontWeight: 'bold' }}>
                        {resumeUploaded ? '1' : '0'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Resume Uploaded
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ color: '#FF0000', fontWeight: 'bold' }}>
                        0
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {userData?.role === 'employer' ? 'Jobs Posted' : 'Applications'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ color: '#FF0000', fontWeight: 'bold' }}>
                        New
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Account Status
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Box sx={{ mt: 3 }}>
              <Card sx={{ 
                backgroundColor: 'white', 
                color: '#333',
                border: '2px solid #FF0000',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
                    Quick Actions
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: '#FF0000',
                          color: 'white',
                          '&:hover': { backgroundColor: '#cc0000' },
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        {userData?.role === 'employer' ? 'Post a Job' : 'Browse Jobs'}
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderColor: '#FF0000',
                          color: '#FF0000',
                          '&:hover': {
                            borderColor: '#cc0000',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                          },
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        {userData?.role === 'employer' ? 'View Candidates' : 'Update Skills'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProfilePage;