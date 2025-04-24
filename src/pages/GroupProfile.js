import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import PostCard from '../components/PostCard';

export default function GroupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [openPost, setOpenPost] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    async function load() {
      const res = await axios.get(`http://localhost:4000/groups/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(res.data);
    }
    load();
  }, [id]);

  if (!data) return <div>Loading…</div>;
  const { group, members, posts } = data;

  const joinOrLeave = async () => {
    const url = group.is_member
      ? `/groups/${id}/leave`
      : `/groups/${id}/join`;
    await axios.post(`http://localhost:4000${url}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const res = await axios.get(`http://localhost:4000/groups/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setData(res.data);
    if (!group.is_member) setOpenPost(false);
  };

  const handleSubmitPost = async () => {
    await axios.post('http://localhost:4000/posts',
      { caption, exercises: JSON.stringify([]), group_id: id },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    const res = await axios.get(`http://localhost:4000/groups/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setData(res.data);
    setCaption('');
    setOpenPost(false);
  };

  return (
    <Box p={4} pb={10}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h3">{group.group_name}</Typography>
        <Button
          variant={group.is_member ? 'outlined' : 'contained'}
          color={group.is_member ? 'error' : 'primary'}
          onClick={joinOrLeave}
        >
          {group.is_member ? 'Leave Group' : group.privacy_setting === 'public' ? 'Join Group' : 'Request to Join'}
        </Button>
      </Box>

      <Typography mb={2}>{group.description}</Typography>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {group.member_count} members
      </Typography>

      <Grid container spacing={1} mb={4}>
        {members.map(m => (
          <Grid item key={m.user_id}>
            <Avatar
              src={
                m.profile_picture
                  ? `data:image/jpeg;base64,${m.profile_picture}`
                  : undefined
              }
            />
          </Grid>
        ))}
      </Grid>

      {(group.is_member || group.privacy_setting === 'public') && (
        <>
          <Button variant="contained" onClick={() => setOpenPost(true)}>
            Post to Group
          </Button>
          <Dialog open={openPost} onClose={() => setOpenPost(false)}>
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
              <Button onClick={() => setOpenPost(false)}>Cancel</Button>
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
      )}

      <Box mt={4}>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.post_id} post={post} />
          ))
        ) : (
          <Typography color="text.secondary">
            No posts here yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
