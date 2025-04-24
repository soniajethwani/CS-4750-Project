import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Link, List, ListItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [open, setOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:4000/fullprofile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfileData(response.data);
        setGroups(response.data.groups); 
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

  const handleFollowersOpen = async () => {
    setFollowersOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/followers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowers(res.data);
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    }
  };

  const handleFollowingOpen = async () => {
    setFollowingOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/following', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowing(res.data);
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
  };

  const handleGroupsOpen = () => {
    setGroupsOpen(true);
  };

  const handleGroupsClose = () => {
    setGroupsOpen(false)
  };

  const handleFollowersClose = () => {
    setFollowersOpen(false)
  };

  const handleFollowingClose = () => {
    setFollowingOpen(false)
  };

  if (!profileData) return <div>Loading...</div>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4">{profileData.profile.username}</Typography>
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

      {/* Profile Summary */}
      <Box display="flex" alignItems="center" mb={3}>
        {profileData.profile.profile_picture && (
          <img 
            src={`data:image/jpeg;base64,${profileData.profile.profile_picture}`} 
            alt="Profile" 
            style={{ width: 100, height: 100, borderRadius: '50%', marginRight: 16 }}
          />
        )}
        <Box display="flex" gap={4} mb={1}>
          <Typography>
            <strong>Followers:</strong> <Link component="button" onClick={handleFollowersOpen}>{profileData.profile.followers}</Link>
          </Typography>
          <Typography>
            <strong>Following:</strong> <Link component="button" onClick={handleFollowingOpen}>{profileData.profile.following}</Link>
          </Typography>
          <Typography>
            <strong>Groups:</strong> <Link component="button" onClick={handleGroupsOpen}>{groups.length}</Link>
          </Typography>
        </Box>
      </Box>
      <Box mt={3} mb={4}>
          <Typography>{profileData.profile.biography || 'No bio yet'}</Typography>
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
                <Typography>Weight: {exercise.weight}{typeof exercise.weight === 'number' ? ' lbs' : ''}</Typography>
                <Typography>Reps: {exercise.reps}</Typography>
                <Typography>Sets: {exercise.sets}</Typography>
              </Box>
            ))}
            
            {/* Display Media if exists */}
            {Array.isArray(post.media) && post.media.length > 0 && post.media.some(m => m.data) && post.media.map(m => {
              //console.log('Media Data:', m.data);
              //console.log('Media MIME Type:', m.mime_type);
              
              return(
              <Box key={m.media_id} mt={2}>
                {m.media_type === 'image' ? (
                  (console.log("TYPE: ", m.mime_type), (
                  <img
                    src={`data:${m.mime_type};base64,${m.data}`}
                    alt="Workout"
                    style={{ maxWidth: "100%", borderRadius: "8px" }}
                  />
                ))) : (
                  <video controls style={{ maxWidth: '100%' }}>
                    <source src={`data:${m.mime_type};base64,${m.data}`} type={m.mime_type} />
                  </video>
                )}
              </Box>
              );
            })}
            

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

      {/* Followers Modal */}
      <Dialog open={followersOpen} onClose={handleFollowersClose}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <List>
            {followers.map((f) => (
              <ListItem key={f.user_id}>{f.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFollowersClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={followingOpen} onClose={handleFollowingClose}>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          <List>
            {following.map((f) => (
              <ListItem key={f.user_id}>{f.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFollowingClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Groups Modal */}
      <Dialog open={groupsOpen} onClose={handleGroupsClose}>
        <DialogTitle>Your Groups</DialogTitle>
        <DialogContent>
          <List>
            {groups.map((g) => (
              <ListItem key={g.group_id}>{g.group_name}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGroupsClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile;