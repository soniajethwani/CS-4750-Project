import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadFeed() {
      const res = await axios.get('http://localhost:4000/feed', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(res.data);
    }
    loadFeed();
  }, []);

  return (
    <Box p={4} pb={10}>
      <Typography variant="h4" mb={2}>Your Feed</Typography>
      {posts.map(post => (
        <PostCard key={post.post_id} post={post} />
      ))}
    </Box>
  );
}
