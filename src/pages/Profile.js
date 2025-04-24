// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  List,
  ListItem,
  TextField,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function Profile() {
  const navigate = useNavigate();

  // profile metadata + editable fields
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  // posts, dialogs, lists
  const [posts, setPosts] = useState([]);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);

  const tokenHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // load profile + posts
  useEffect(() => {
    async function loadData() {
      try {
        const [fullRes, feedRes] = await Promise.all([
          axios.get('http://localhost:4000/fullprofile', tokenHeader),
          axios.get('http://localhost:4000/feed', tokenHeader)
        ]);
        const { profile: prof, groups: grps } = fullRes.data;
        setProfile(prof);
        setGroups(grps);
        setNewUsername(prof.username);
        setNewBio(prof.biography || '');
        setPosts(feedRes.data.filter(p => p.user_id === prof.user_id));
      } catch (err) {
        console.error('Error loading profile or feed:', err);
      }
    }
    loadData();
  }, []);

  // load follow-requests
  useEffect(() => {
    axios.get('http://localhost:4000/follow-requests', tokenHeader)
      .then(res => setFollowRequests(res.data))
      .catch(console.error);
  }, []);

  // helper to fetch lists when opening dialogs
  const fetchList = async (url, setter, openSetter) => {
    openSetter(true);
    try {
      const res = await axios.get(url, tokenHeader);
      setter(res.data);
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const accept = async uid => {
    await axios.post(`http://localhost:4000/follow-requests/${uid}/accept`, {}, tokenHeader);
    setFollowRequests(fr => fr.filter(r => r.user_id !== uid));
  };
  const decline = async uid => {
    await axios.delete(`http://localhost:4000/follow-requests/${uid}/decline`, tokenHeader);
    setFollowRequests(fr => fr.filter(r => r.user_id !== uid));
  };

  // save edited profile
  const handleSaveProfile = async () => {
    const res = await axios.patch(
      'http://localhost:4000/profile',
      { username: newUsername, biography: newBio },
      tokenHeader
    );
    setProfile(res.data);
    setEditOpen(false);
  };

  // delete one of your posts
  const handleDeletePost = async (postId) => {
    await axios.delete(`http://localhost:4000/posts/${postId}`, tokenHeader);
    setPosts(ps => ps.filter(p => p.post_id !== postId));
  };

  if (!profile) return <Typography>Loading…</Typography>;

  return (
    <Box p={4}>
      {/* header */}
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4">{profile.username}</Typography>
        <Box>
          <Button onClick={() => setEditOpen(true)} sx={{ mr: 2 }}>
            Edit Profile
          </Button>
          <Button onClick={() => navigate('/log-workout')} sx={{ mr: 2 }}>
            Log Workout
          </Button>
          <Button onClick={() => setRequestsOpen(true)} sx={{ mr: 2 }}>
            View Requests
          </Button>
          <Button color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* stats */}
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
            <Link component="button" onClick={() => fetchList('http://localhost:4000/followers', setFollowers, setFollowersOpen)}>
              {profile.followers}
            </Link>
          </Typography>
          <Typography>
            <strong>Following:</strong>{' '}
            <Link component="button" onClick={() => fetchList('http://localhost:4000/following', setFollowing, setFollowingOpen)}>
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

      {/* bio */}
      <Box mb={4}>
        <Typography>{profile.biography || 'No bio yet'}</Typography>
      </Box>

      {/* posts */}
      <Box>
      {posts.length > 0 ? (
        posts.map(post => (
          <Box
            key={post.post_id}
            mb={2}
            position="relative"      // make this container the positioning context
          >
            <PostCard post={post} />
            <IconButton
              onClick={() => handleDeletePost(post.post_id)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.8)'
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))
      ) : (
        <Typography color="text.secondary">You haven’t posted anything yet.</Typography>
      )}
      </Box>


      {/* Edit Profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
          />
          <TextField
            label="Biography"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={newBio}
            onChange={e => setNewBio(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Followers dialog */}
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

      {/* Following dialog */}
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

      {/* Groups & Requests dialogs unchanged… */}
    </Box>
  );
}
