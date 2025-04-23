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
  const [followRequests, setFollowRequests] = useState([]);
  const [requestsOpen, setRequestsOpen] = useState(false);


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

  useEffect(() => {
    axios.get("http://localhost:4000/follow-requests", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then((res) => setFollowRequests(res.data));
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
  const accept = async (uid) => {
      await axios.post(`http://localhost:4000/follow-requests/${uid}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
    
      setFollowRequests(prev => prev.filter(r => r.user_id !== uid));
    
      try {
        const response = await axios.get('http://localhost:4000/fullprofile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfileData(response.data);
      } catch (err) {
        console.error("Failed to refresh profile data:", err);
      }
    };
  
  
  const decline = async (uid) => {
    await axios.delete(`http://localhost:4000/follow-requests/${uid}/decline`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setFollowRequests(prev => prev.filter(r => r.user_id !== uid));
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
            color="primary"
            onClick={() => navigate('/log-workout')}
            style={{ marginRight: '16px' }}
          >
            Log Workout
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setRequestsOpen(true)}
            style={{ marginRight: '16px' }}
          >
            View Requests
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

      {/* Followers Modal */}
      <Dialog open={followersOpen} onClose={handleFollowersClose}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <List>
            {followers.map((f) => (
              <ListItem 
                key={f.user_id} 
                button 
                onClick={() => {
                  setFollowersOpen(false);
                  navigate(`/users/${f.user_id}`);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <Typography>{f.username}</Typography>
              </ListItem>
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
              <ListItem 
                key={f.user_id} 
                button 
                onClick={() => {
                  setFollowingOpen(false);
                  navigate(`/users/${f.user_id}`);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <Typography>{f.username}</Typography>
              </ListItem>
            
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
              <ListItem
                key={g.group_id}
                button
                onClick={() => {
                  setGroupsOpen(false);
                  navigate(`/groups/${g.group_id}`);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <Typography>{g.group_name}</Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGroupsClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View requests modal */}
      <Dialog open={requestsOpen} onClose={() => setRequestsOpen(false)}>
        <DialogTitle>Follow Requests</DialogTitle>
        <DialogContent>
          {followRequests.length === 0 ? (
            <Typography>No pending requests.</Typography>
          ) : (
            <List>
              {followRequests.map(req => (
                <ListItem key={req.user_id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{req.username}</Typography>
                  <Box>
                    <Button size="small" color="success" onClick={() => accept(req.user_id)}>Accept</Button>
                    <Button size="small" color="error" onClick={() => decline(req.user_id)}>Decline</Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile;