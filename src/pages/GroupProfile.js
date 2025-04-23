import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material';

export default function GroupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [openPost, setOpenPost] = useState(false);
  const [caption, setCaption] = useState('');
  // you could expand to exercises/media if you want full workout-posting

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`http://localhost:4000/groups/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(res.data);
    };
    load();
  }, [id]);

  if (!data) return <div>Loading…</div>;
  const { group, members, posts } = data;

  const handleJoin = async () => {
    await axios.post(`http://localhost:4000/groups/${id}/join`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    // reload
    const res = await axios.get(`http://localhost:4000/groups/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setData(res.data);
  };

  const handleLeave = async () => {
    await axios.post(`http://localhost:4000/groups/${id}/leave`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    navigate('/groups');
  };

  const handleOpenPost = () => setOpenPost(true);
  const handleClosePost = () => {
    setCaption('');
    setOpenPost(false);
  };

  const handleSubmitPost = async () => {
    // simple text-only post; expand for media/exercises if desired
    await axios.post('http://localhost:4000/posts',
      { caption, exercises: JSON.stringify([]), group_id: id },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    const res = await axios.get(`http://localhost:4000/groups/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setData(res.data);
    handleClosePost();
  };

  return (
    <Box p={4} pb={10}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h3">{group.group_name}</Typography>
        {group.is_member
          ? <Button color="error" variant="outlined" onClick={handleLeave}>
              Leave Group
            </Button>
          : group.privacy_setting === 'public'
            ? <Button variant="contained" onClick={handleJoin}>
                Join Group
              </Button>
            : <Button disabled>Request to Join</Button>
        }
      </Box>

      <Typography mb={2}>{group.description}</Typography>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {group.member_count} members
      </Typography>

      {/* Member avatars */}
      <Grid container spacing={1} mb={4}>
        {members.map(m => (
          <Grid item key={m.user_id}>
            <Avatar
              src={m.profile_picture
                ? `data:image/jpeg;base64,${m.profile_picture}`
                : undefined}
            />
          </Grid>
        ))}
      </Grid>

      {/* Post-to-group button */}
      {group.is_member || group.privacy_setting === 'public' ? (
        <>
          <Button variant="contained" onClick={handleOpenPost}>
            Post to Group
          </Button>
          <Dialog open={openPost} onClose={handleClosePost}>
            <DialogTitle>New Group Post</DialogTitle>
            <DialogContent>
              <TextField
                label="Caption"
                fullWidth
                multiline
                rows={3}
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePost}>Cancel</Button>
              <Button
                onClick={handleSubmitPost}
                variant="contained"
                disabled={!caption.trim()}
              >
                Post
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : null}

      {/* Wall of posts */}
      <Box mt={4}>
        {posts.map(post => (
          <Card key={post.post_id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {post.username} • {new Date(post.timestamp).toLocaleString()}
              </Typography>
              <Typography paragraph>{post.caption}</Typography>
              {/* workout cards etc if present… */}
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <Typography color="text.secondary">
            No posts here yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
