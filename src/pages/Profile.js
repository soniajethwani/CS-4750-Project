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
  ListItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [groups, setGroups] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);

  const tokenHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // ——— load profile metadata, your posts, and your groups ———
  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token');
      const [pRes, fRes] = await Promise.all([
        axios.get('http://localhost:4000/profile', tokenHeader),
        axios.get('http://localhost:4000/feed',    tokenHeader)
      ]);
      setProfile(pRes.data);
      setPosts(fRes.data.filter(p => p.user_id === pRes.data.user_id));
      const gRes = await axios.get('http://localhost:4000/fullprofile', tokenHeader);
      setGroups(gRes.data.groups);
    }
    load();
  }, []);

  // ——— load follow-requests once ———
  useEffect(() => {
    axios.get('http://localhost:4000/follow-requests', tokenHeader)
      .then(res => setFollowRequests(res.data))
      .catch(console.error);
  }, []);

  const fetchList = async (url, setter, openSetter) => {
    openSetter(true);
    const res = await axios.get(url, tokenHeader);
    setter(res.data);
  };

  // ——— additional handlers ———
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  const accept = async (uid) => {
    await axios.post(`http://localhost:4000/follow-requests/${uid}/accept`, {}, tokenHeader);
    setFollowRequests(fr => fr.filter(r => r.user_id !== uid));
  };
  const decline = async (uid) => {
    await axios.delete(`http://localhost:4000/follow-requests/${uid}/decline`, tokenHeader);
    setFollowRequests(fr => fr.filter(r => r.user_id !== uid));
  };

  if (!profile) return <div>Loading…</div>;

  return (
    <Box p={4}>
      {/* header */}
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4">{profile.username}</Typography>
        <Box>
          <Button onClick={() => setOpenDetails(true)} sx={{ mr: 2 }}>View Profile</Button>
          <Button onClick={() => navigate('/log-workout')} sx={{ mr: 2 }}>Log Workout</Button>
          <Button onClick={() => setRequestsOpen(true)} sx={{ mr: 2 }}>View Requests</Button>
          <Button color="error" onClick={handleLogout}>Logout</Button>
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
            <Link component="button"
                  onClick={() => fetchList('http://localhost:4000/followers', setFollowers, setFollowersOpen)}>
              {profile.followers}
            </Link>
          </Typography>
          <Typography>
            <strong>Following:</strong>{' '}
            <Link component="button"
                  onClick={() => fetchList('http://localhost:4000/following', setFollowing, setFollowingOpen)}>
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
        {posts.length > 0
          ? posts.map(post => <PostCard key={post.post_id} post={post} />)
          : <Typography color="text.secondary">You haven’t posted anything yet.</Typography>
        }
      </Box>

      {/* dialogs */}
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

      <Dialog open={followersOpen} onClose={() => setFollowersOpen(false)}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <List>
            {followers.map(f => (
              <ListItem key={f.user_id} button onClick={() => { setFollowersOpen(false); navigate(`/users/${f.user_id}`); }}>
                {f.username}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={followingOpen} onClose={() => setFollowingOpen(false)}>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          <List>
            {following.map(f => (
              <ListItem key={f.user_id} button onClick={() => { setFollowingOpen(false); navigate(`/users/${f.user_id}`); }}>
                {f.username}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={groupsOpen} onClose={() => setGroupsOpen(false)}>
        <DialogTitle>Your Groups</DialogTitle>
        <DialogContent>
          <List>
            {groups.map(g => (
              <ListItem key={g.group_id} button onClick={() => { setGroupsOpen(false); navigate(`/groups/${g.group_id}`); }}>
                {g.group_name}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={requestsOpen} onClose={() => setRequestsOpen(false)}>
        <DialogTitle>Follow Requests</DialogTitle>
        <DialogContent>
          {followRequests.length === 0
            ? <Typography>No pending requests.</Typography>
            : (
              <List>
                {followRequests.map(req => (
                  <ListItem key={req.user_id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{req.username}</Typography>
                    <Box>
                      <Button size="small" color="success" onClick={() => accept(req.user_id)}>Accept</Button>
                      <Button size="small" color="error"   onClick={() => decline(req.user_id)}>Decline</Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
