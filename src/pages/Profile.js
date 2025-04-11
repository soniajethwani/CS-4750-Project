import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:4000/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPosts(res.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h3" gutterBottom>
        Welcome!
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => navigate('/log-workout')}
        style={{ marginBottom: '32px' }}
      >
        Log Workout
      </Button>

      {/* Posts Section */}
      {posts.map((post) => (
        <Card key={post.post_id} style={{ marginBottom: '16px' }}>
          <CardContent>
            <Typography variant="h6">{new Date(post.timestamp).toLocaleString()}</Typography>
            <Typography>{post.caption}</Typography>
            
            {/* Display Exercises */}
            {post.workout && post.workout.exercises.map((exercise, i) => (
              <Box key={i} p={1} mt={1} border={1} borderRadius={1}>
                <Typography><strong>{exercise.name}</strong></Typography>
                <Typography>Weight: {exercise.weight} lbs</Typography>
                <Typography>Reps: {exercise.reps}</Typography>
                <Typography>Sets: {exercise.sets}</Typography>
              </Box>
            ))}
            
            {/* Display Media if exists */}
            {post.media && (
              <Box mt={2}>
                {post.media.media_type === 'image' ? (
                  <img 
                    src={`data:${post.media.mime_type};base64,${post.media.data}`} 
                    alt="Workout" 
                    style={{ maxWidth: '100%' }}
                  />
                ) : (
                  <video controls style={{ maxWidth: '100%' }}>
                    <source src={`data:${post.media.mime_type};base64,${post.media.data}`} />
                  </video>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default Profile;