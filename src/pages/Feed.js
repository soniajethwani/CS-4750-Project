import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, CardContent } from '@mui/material';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadFeed = async () => {
      const res = await axios.get('http://localhost:4000/feed', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(res.data);
    };
    loadFeed();
  }, []);

  return (
    <Box p={4} pb={10 /* account for nav */}>
      <Typography variant="h4" mb={2}>Your Feed</Typography>
      {posts.map(post => (
        <Card key={post.post_id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {post.group_id 
                ? `#${post.group_name}` 
                : post.username} &nbsp;–&nbsp; 
              {new Date(post.timestamp).toLocaleString()}
            </Typography>
            <Typography paragraph>{post.caption}</Typography>

            {/* workout details */}
            {post.workout?.exercises?.map((ex, i) => (
              <Box key={i} mb={1} p={1} border={1} borderRadius={1}>
                <Typography><strong>{ex.name}</strong></Typography>
                <Typography>Weight: {ex.weight}{typeof ex.weight === 'number' ? ' lbs' : ''}</Typography>
                <Typography>Reps: {ex.reps}, Sets: {ex.sets}</Typography>
              </Box>
            ))}

            {/* media */}
            {Array.isArray(post.media) && post.media.length > 0 && post.media.some(m => m.data) && post.media.map(m => (
              <Box key={m.media_id} mt={2}>
                {m.media_type === 'image' ? (
                  <img
                    src={`data:${m.mime_type};base64,${m.data}`}
                    alt=""
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
    </Box>
  );
}
