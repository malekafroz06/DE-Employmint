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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  CheckCircle,
  Close,
  Delete,
} from '@mui/icons-material';

const ProfilePage = ({ userData: initialUserData = {}, onLogout = () => {}, onNavigate = () => {} }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [profileImage, setProfileImage] = useState(userData?.profileImage || "https://via.placeholder.com/150/FF0000/FFFFFF?text=USER");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const profileImageRef = useRef(null);
  const resumeFileRef = useRef(null);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageData = e.target.result;
        setProfileImage(newImageData);
        setUserData(prev => ({...prev, profileImage: newImageData}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
     window.location.href = "/"; 
  };

  const extractSkillsFromText = (text) => {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind', 'Material-UI',
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
      'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence',
      'Figma', 'Adobe', 'Photoshop', 'Illustrator',
      'Machine Learning', 'AI', 'Data Science', 'Analytics',
      'REST API', 'GraphQL', 'Microservices', 'DevOps',
      'Testing', 'Jest', 'Cypress', 'Selenium',
      'Agile', 'Scrum', 'Project Management'
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('skill') || line.includes('technolog') || line.includes('tool')) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const skillLine = lines[j].trim();
          if (skillLine && skillLine.length < 200) {
            const possibleSkills = skillLine.split(/[,•\-\|]/);
            possibleSkills.forEach(skill => {
              const cleanSkill = skill.trim().replace(/[^\w\s\.\+\#]/g, '');
              if (cleanSkill.length > 2 && cleanSkill.length < 20 && 
                  !cleanSkill.toLowerCase().includes('experience') &&
                  !cleanSkill.toLowerCase().includes('year')) {
                foundSkills.push(cleanSkill);
              }
            });
          }
        }
        break;
      }
    }

    const uniqueSkills = [...new Set(foundSkills)];
    return uniqueSkills.slice(0, 4).join(', ');
  };

  const extractDataFromResume = async (file) => {
    const extractedData = {};
    let text = '';

    try {
      if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        try {
          text = await file.text();
        } catch (error) {
          console.log('Cannot read file as text, using filename for extraction');
        }
        
        if (!text || text.includes('%PDF') || text.includes('<<') || text.includes('endobj')) {
          text = `Resume for ${file.name.replace(/\.(pdf|doc|docx)$/i, '').replace(/[-_]/g, ' ')}`;
        }
      }

      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
      const emails = text.match(emailRegex);
      if (emails && emails.length > 0) {
        extractedData.email = emails[0];
      }

      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
      const phones = text.match(phoneRegex);
      if (phones && phones.length > 0) {
        extractedData.phone = phones[0].replace(/[-.\s()]/g, '');
      }

      const fileName = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
      const fileNameParts = fileName.split(/[-_\s]+/).filter(part => part.length > 1);
      
      if (fileNameParts.length >= 2) {
        extractedData.firstName = fileNameParts[0];
        extractedData.lastName = fileNameParts.slice(1).join(' ');
      } else if (fileNameParts.length === 1) {
        extractedData.firstName = fileNameParts[0];
      }

      if (!extractedData.firstName && text && !text.includes('<<') && !text.includes('endobj')) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (let line of lines.slice(0, 5)) {
          line = line.trim();
          if (line.length > 2 && line.length < 50 && 
              !emailRegex.test(line) && 
              !phoneRegex.test(line) && 
              !/^\d/.test(line) &&
              !/address|street|city|state|zip|resume/i.test(line)) {
            const nameParts = line.split(/\s+/);
            if (nameParts.length >= 2 && nameParts.every(part => part.length > 1)) {
              extractedData.firstName = nameParts[0];
              extractedData.lastName = nameParts.slice(1).join(' ');
              break;
            }
          }
        }
      }

      if (text && !text.includes('<<') && !text.includes('endobj')) {
        const skills = extractSkillsFromText(text);
        if (skills) {
          extractedData.skills = skills;
        }
      } else {
        const fileNameLower = fileName.toLowerCase();
        if (fileNameLower.includes('frontend') || fileNameLower.includes('react')) {
          extractedData.skills = 'React, JavaScript, HTML, CSS';
        } else if (fileNameLower.includes('backend') || fileNameLower.includes('node')) {
          extractedData.skills = 'Node.js, JavaScript, MongoDB, Express';
        } else if (fileNameLower.includes('fullstack') || fileNameLower.includes('full-stack')) {
          extractedData.skills = 'JavaScript, React, Node.js, MongoDB';
        } else if (fileNameLower.includes('python')) {
          extractedData.skills = 'Python, Django, PostgreSQL, REST API';
        } else {
          extractedData.skills = 'JavaScript, HTML, CSS, Git';
        }
      }

      const roleKeywords = ['developer', 'engineer', 'designer', 'manager', 'analyst', 'consultant'];
      const fileNameLower = fileName.toLowerCase();
      
      for (let role of roleKeywords) {
        if (fileNameLower.includes(role)) {
          extractedData.jobTitle = role.charAt(0).toUpperCase() + role.slice(1);
          break;
        }
      }

      if (!extractedData.jobTitle) {
        if (extractedData.skills?.includes('React') || extractedData.skills?.includes('JavaScript')) {
          extractedData.jobTitle = 'Frontend Developer';
        } else {
          extractedData.jobTitle = 'Software Developer';
        }
      }

    } catch (error) {
      console.error('Error parsing resume:', error);
      const fileName = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
      const nameParts = fileName.split(/[-_\s]+/);
      if (nameParts.length >= 2) {
        extractedData.firstName = nameParts[0];
        extractedData.lastName = nameParts[1];
      }
      extractedData.skills = 'JavaScript, HTML, CSS, Git';
      extractedData.jobTitle = 'Developer';
    }

    return extractedData;
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        setIsProcessingResume(true);
        
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        };
        setResumeFile(fileInfo);
        
        try {
          const extractedData = await extractDataFromResume(file);
          
          setUserData(prevData => ({
            ...prevData,
            ...extractedData,
            role: prevData.role || 'candidate'
          }));

          setResumeUploaded(true);
          setShowSuccessMessage(true);
          
          setTimeout(() => setShowSuccessMessage(false), 5000);
          
        } catch (error) {
          console.error('Error processing resume:', error);
          alert('Error processing resume. Please try again or upload a different format.');
        } finally {
          setIsProcessingResume(false);
        }
      } else {
        alert('Please upload a PDF, Word document, or text file');
      }
    }
  };

  const handleDeleteResume = () => {
    setResumeFile(null);
    setResumeUploaded(false);
    
    setUserData(prevData => {
      const clearedData = { ...prevData };
      delete clearedData.firstName;
      delete clearedData.lastName;
      delete clearedData.email;
      delete clearedData.phone;
      delete clearedData.skills;
      delete clearedData.jobTitle;
      return clearedData;
    });
    
    const defaultImage = "https://via.placeholder.com/150/FF0000/FFFFFF?text=USER";
    setProfileImage(defaultImage);
  };

  const handleDownloadResume = () => {
    alert('Resume file is no longer available for download. Please upload a new resume.');
  };

  const handleEditProfile = () => {
    setEditFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      jobTitle: userData?.jobTitle || '',
      skills: userData?.skills || '',
      companyName: userData?.companyName || '',
      website: userData?.website || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    setUserData(prev => ({
      ...prev,
      ...editFormData
    }));
    setEditDialogOpen(false);
  };

  const handleBrowseJobs = () => {
    if (onNavigate) onNavigate('/jobs');
    else window.location.href = '/jobs';
  };

  const handlePostJob = () => {
    if (onNavigate) onNavigate('/post-job');
    else window.location.href = '/post-job';
  };

  const handleViewCandidates = () => {
    if (onNavigate) onNavigate('/candidates');
    else window.location.href = '/candidates';
  };

  const profileCompleteness = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const completedFields = requiredFields.filter(field => userData?.[field]);
    let percentage = (completedFields.length / requiredFields.length) * 100;
    
    if (profileImage && !profileImage.includes('placeholder')) {
      percentage += 10;
    }
    if (resumeUploaded) {
      percentage += 10;
    }
    
    return Math.min(Math.round(percentage), 100);
  };

  const showInitialUploadPrompt = !resumeUploaded && (!userData?.firstName || !userData?.lastName || !userData?.email || !userData?.phone);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffffff1e 0%, #f8f9fa53 100%)',
      py: 4,
      px: 2,
      paddingTop: 10
    }}>
      <Box maxWidth="lg" mx="auto">
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#020330', fontWeight: 'bold' }}>
            My Profile
          </Typography>
          <Button
            variant="outlined"
            onClick={handleLogout}
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

        {showSuccessMessage && (
          <Alert 
            severity="success" 
            icon={<CheckCircle />}
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowSuccessMessage(false)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
          >
            Resume uploaded successfully! Your profile has been automatically updated with information from your resume.
          </Alert>
        )}

        {showInitialUploadPrompt && (
          <Card sx={{ 
            backgroundColor: '#e5e4e1ff', 
            color: '#d7d6d2ff',
            border: '1px solid #f1efebff',
            borderRadius: 0.5,
            mb: 4,
            // boxShadow: '0 8px 32px rgba(255, 234, 167, 0.3)',
          }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Upload sx={{ fontSize: 64, color: '#FF0000', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#022030' }}>
                Complete Your Profile
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mb: 3, maxWidth: 600, mx: 'auto' }}>
                First, upload your resume to automatically fill your profile details like name, phone, email, and skills. 
                This will save you time and ensure your profile is complete!
              </Typography>
              
              <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={isProcessingResume ? <CircularProgress size={20} color="inherit" /> : <Upload />}
                  onClick={() => resumeFileRef.current?.click()}
                  disabled={isProcessingResume}
                  sx={{
                    backgroundColor: '#FF0000',
                    color: 'white',
                    '&:hover': { backgroundColor: '#cc0000' },
                    py: 1,
                    px: 3,
                    fontSize: '1rem',
                  }}
                >
                  {isProcessingResume ? 'Processing Resume...' : 'Upload Resume to Autofill details'}
                </Button>
              </Box>
              
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 2 }}>
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </Typography>

              <input
                type="file"
                ref={resumeFileRef}
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleResumeUpload}
                style={{ display: 'none' }}
              />
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 2,
              // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
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
                  onClick={handleEditProfile}
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

            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 2,
              mt: 3,
              // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Resume
                  </Typography>
                  {resumeUploaded && (
                    <IconButton
                      onClick={handleDeleteResume}
                      size="small"
                      sx={{
                        color: '#ff4444',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        },
                      }}
                      title="Delete Resume"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
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
                    {isProcessingResume ? (
                      <CircularProgress sx={{ color: '#FF0000', mb: 2 }} size={48} />
                    ) : (
                      <Upload sx={{ fontSize: 48, color: '#FF0000', mb: 2 }} />
                    )}
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      {isProcessingResume ? 'Processing resume...' : 'Click to upload your resume'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      PDF, DOC, DOCX, TXT up to 10MB
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
                              {resumeFile?.type?.includes('pdf') ? 'PDF' : 
                               resumeFile?.type?.includes('doc') ? 'DOC' : 'TXT'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                              {resumeFile?.name || 'Resume'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Uploaded • {resumeFile?.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
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
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 2,
              mb: 3,
              // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#020330' }}>
                    Personal Information
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={handleEditProfile}
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
                        <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
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
                        <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
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
                        <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
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
                          Job Title
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#020330', textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {userData?.jobTitle || userData?.role || 'Not specified'}
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
                        <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
                          {userData?.username || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {userData?.skills && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="flex-start" sx={{ mb: 2 }}>
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
                            SK
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Skills (from Resume)
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
                            {userData.skills}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {userData?.role === 'employer' && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <Business sx={{ color: '#FF0000', mr: 2, fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Company Name
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
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
                            <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
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

            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 2,
              mb: 3,
              // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#020330' }}>
                    Resume & Documents
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={isProcessingResume ? <CircularProgress size={16} /> : <Upload />}
                    onClick={() => resumeFileRef.current?.click()}
                    disabled={isProcessingResume}
                    sx={{
                      borderColor: '#FF0000',
                      color: '#FF0000',
                      '&:hover': {
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      },
                    }}
                  >
                    {isProcessingResume ? 'Processing...' : 'Upload Resume'}
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
                    {isProcessingResume ? (
                      <CircularProgress sx={{ color: '#FF0000', mb: 2 }} size={64} />
                    ) : (
                      <Upload sx={{ fontSize: 64, color: '#FF0000', mb: 2 }} />
                    )}
                    <Typography variant="h6" sx={{ color: '#020330', mb: 1, fontWeight: 'bold' }}>
                      {isProcessingResume ? 'Processing Your Resume...' : 'Upload Your Resume'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {isProcessingResume ? 'Extracting information from your resume...' : 'Drag and drop your resume here, or click to browse'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                      Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
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
                              {resumeFile?.type?.includes('pdf') ? 'PDF' : 
                               resumeFile?.type?.includes('doc') ? 'DOC' : 'TXT'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body1" sx={{ color: '#020330', fontWeight: 'bold' }}>
                              {resumeFile?.name || 'Resume'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Uploaded • {resumeFile?.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
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
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: 'white', 
              color: '#333',
              border: '2px solid #FF0000',
              borderRadius: 2,
              // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
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

            <Box sx={{ mt: 3 }}>
              <Card sx={{ 
                backgroundColor: 'white', 
                color: '#333',
                border: '2px solid #FF0000',
                borderRadius: 2,
                // boxShadow: '0 8px 32px rgba(255, 0, 0, 0.1)',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#020330' }}>
                    Quick Actions
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={userData?.role === 'employer' ? handlePostJob : handleBrowseJobs}
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
                        onClick={userData?.role === 'employer' ? handleViewCandidates : handleEditProfile}
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

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#FF0000', color: 'white' }}>
          Edit Profile Information
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editFormData.firstName || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, firstName: e.target.value}))}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editFormData.lastName || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, lastName: e.target.value}))}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, email: e.target.value}))}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, phone: e.target.value}))}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={editFormData.jobTitle || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, jobTitle: e.target.value}))}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
            {userData?.role === 'employer' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={editFormData.companyName || ''}
                    onChange={(e) => setEditFormData(prev => ({...prev, companyName: e.target.value}))}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF0000',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF0000',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={editFormData.website || ''}
                    onChange={(e) => setEditFormData(prev => ({...prev, website: e.target.value}))}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF0000',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF0000',
                      },
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Skills"
                multiline
                rows={3}
                value={editFormData.skills || ''}
                onChange={(e) => setEditFormData(prev => ({...prev, skills: e.target.value}))}
                margin="normal"
                placeholder="e.g., JavaScript, React, Node.js, Python..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF0000',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF0000',
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            sx={{
              backgroundColor: '#FF0000',
              color: 'white',
              '&:hover': { backgroundColor: '#cc0000' },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;