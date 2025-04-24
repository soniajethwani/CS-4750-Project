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
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [openPost, setOpenPost] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token');
      // fetch group metadata + members
      const grpRes = await axios.get(`http://localhost:4000/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(grpRes.data.group);
      setMembers(grpRes.data.members);

      // fetch full feed & filter to this group
      const feedRes = await axios.get('http://localhost:4000/feed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(feedRes.data.filter(p => p.group_id === parseInt(id, 10)));
    }
    load();
  }, [id]);

  if (!group) return <div>Loading…</div>;

  const joinOrLeave = async () => {
    const token = localStorage.getItem('token');
    const path = group.is_member ? 'leave' : 'join';
    await axios.post(`http://localhost:4000/groups/${id}/${path}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOpenPost(false);
    navigate(0); // simple reload
  };

  const handleSubmitPost = async () => {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:4000/posts',
      { caption, exercises: JSON.stringify([]), group_id: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setCaption('');
    setOpenPost(false);
    navigate(0); // reload to pick up new comment/like state
  };

  return (
    <Box p={4} pb={10}>
      {/* header */}
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

      {/* avatars */}
      <Grid container spacing={1} mb={4}>
        {members.map(m => (
          <Grid item key={m.user_id}>
            <Avatar src={m.profile_picture ? `data:image/jpeg;base64,${m.profile_picture}` : undefined} />
          </Grid>
        ))}
      </Grid>

      {/* new post */}
      {(group.is_member || group.privacy_setting === 'public') && (
        <>
          <Button variant="contained" onClick={() => setOpenPost(true)}>Post to Group</Button>
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
              <Button onClick={handleSubmitPost} variant="contained" disabled={!caption.trim()}>
                Post
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* posts */}
      <Box mt={4}>
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.post_id} post={post} />)
        ) : (
          <Typography color="text.secondary">No posts here yet.</Typography>
        )}
      </Box>
    </Box>
  );
}
