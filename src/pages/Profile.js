import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  List,
  ListItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    async function fetchProfile() {
      const res = await axios.get('http://localhost:4000/fullprofile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfileData(res.data);
      setGroups(res.data.groups);
    }
    fetchProfile();
  }, []);

  if (!profileData) return <div>Loading...</div>;

  const { profile, posts } = profileData;
  const tokenHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchList = async (url, setter, openSetter) => {
    openSetter(true);
    const res = await axios.get(url, tokenHeader);
    setter(res.data);
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4">{profile.username}</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDetails(true)}
            sx={{ mr: 2 }}
          >
            View Profile
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/log-workout')}
            sx={{ mr: 2 }}
          >
            Log Workout
          </Button>
          <Button variant="contained" color="error" onClick={() => {
            localStorage.removeItem('token');
            navigate('/');
          }}>
            Logout
          </Button>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" mb={3}>
        {profile.profile_picture && (
          <img
            src={`data:image/jpeg;base64,${profile.profile_picture}`}
            alt="Profile"
            style={{ width: 100, height: 100, borderRadius: '50%', marginRight: 16 }}
          />
        )}
        <Box display="flex" gap={4}>
          <Typography>
            <strong>Followers:</strong>{' '}
            <Link component="button" onClick={() => fetchList(
              'http://localhost:4000/followers',
              setFollowers,
              setFollowersOpen
            )}>
              {profile.followers}
            </Link>
          </Typography>
          <Typography>
            <strong>Following:</strong>{' '}
            <Link component="button" onClick={() => fetchList(
              'http://localhost:4000/following',
              setFollowing,
              setFollowingOpen
            )}>
              {profile.following}
            </Link>
          </Typography>
          <Typography>
            <strong>Groups:</strong>{' '}
            <Link component="button" onClick={() => setGroupsOpen(true)}>
              {groups.length}
            </Link>
          </Typography>
        </Box>
      </Box>

      <Box mb={4}>
        <Typography>{profile.biography || 'No bio yet'}</Typography>
      </Box>

      <Box>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.post_id} post={post} />
          ))
        ) : (
          <Typography color="text.secondary">
            You haven’t posted anything yet.
          </Typography>
        )}
      </Box>

      {/* Profile Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)}>
        <DialogTitle>User Profile Details</DialogTitle>
        <DialogContent>
          <Typography><strong>User ID:</strong> {profile.user_id}</Typography>
          <Typography><strong>Privacy:</strong> {profile.privacy_setting}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Followers Dialog */}
      <Dialog open={followersOpen} onClose={() => setFollowersOpen(false)}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <List>
            {followers.map(f => (
              <ListItem key={f.user_id}>{f.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={followingOpen} onClose={() => setFollowingOpen(false)}>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          <List>
            {following.map(f => (
              <ListItem key={f.user_id}>{f.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Groups Dialog */}
      <Dialog open={groupsOpen} onClose={() => setGroupsOpen(false)}>
        <DialogTitle>Your Groups</DialogTitle>
        <DialogContent>
          <List>
            {groups.map(g => (
              <ListItem key={g.group_id}>{g.group_name}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
