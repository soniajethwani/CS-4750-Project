import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:4000/fullprofile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleOpenProfile = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!profileData) return <div>Loading...</div>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h3">Welcome, {profileData.profile.username}!</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOpenProfile}
            style={{ marginRight: '16px' }}
          >
            View Profile
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => navigate('/log-workout')}
            style={{ marginRight: '16px' }}
          >
            Log Workout
          </Button>
          <Button 
            variant="contained" 
            color="danger"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Posts Section */}
      {(profileData.posts || []).map((post) => (
        <Card key={post.post_id} style={{ marginBottom: '16px' }}>
          <CardContent>
            <Typography variant="h6">{new Date(post.timestamp).toLocaleString()}</Typography>
            <Typography>{post.caption}</Typography>
            
            {/* Display Exercises */}
            {post.workout?.exercises?.map((exercise, i) => (
              <Box key={i} p={1} mt={1} border={1} borderRadius={1}>
                <Typography><strong>{exercise.name}</strong></Typography>
                <Typography>Weight: {exercise.weight} lbs</Typography>
                <Typography>Reps: {exercise.reps}</Typography>
                <Typography>Sets: {exercise.sets}</Typography>
              </Box>
            ))}
            
            {/* Display Media if exists */}
            {Array.isArray(post.media) && post.media.map(m => (
              <Box key={m.media_id} mt={2}>
                {m.media_type === 'image' ? (
                  <img
                    src={`data:${m.mime_type};base64,${m.data}`}
                    alt="Workout"
                    style={{ maxWidth: '100%' }}
                  />
                ) : (
                  <video controls style={{ maxWidth: '100%' }}>
                    <source src={`data:${m.mime_type};base64,${m.data}`} />
                  </video>
                )}
              </Box>
            ))}
            

          </CardContent>
        </Card>
      ))}

      {/* Profile Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>User Profile Details</DialogTitle>
        <DialogContent>
          <Typography><strong>User ID:</strong> {profileData.profile.user_id}</Typography>
          <Typography><strong>Username:</strong> {profileData.profile.username}</Typography>
          <Typography><strong>Biography:</strong> {profileData.profile.biography || 'Not specified'}</Typography>
          <Typography><strong>Privacy Setting:</strong> {profileData.profile.privacy_setting}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile;