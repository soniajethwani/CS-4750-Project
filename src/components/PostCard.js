import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  TextField,
  Button,
  Avatar
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export default function PostCard({ post }) {
  // grab everything from "post" itself:
  const currentUserId = post.current_user_id;

  const [likes, setLikes] = useState({
    count: post.like_count,
    liked: post.liked_by_user
  });
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');

  const toggleLike = async () => {
    const method = likes.liked ? 'delete' : 'post';
    const { data } = await axios({
      method,
      url: `http://localhost:4000/posts/${post.post_id}/like`,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setLikes(data);
  };

  const submitComment = async () => {
    const content = newComment.trim();
    if (!content) return;
    const { data } = await axios.post(
      `http://localhost:4000/posts/${post.post_id}/comments`,
      { content },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    setComments([...comments, data]);
    setNewComment('');
  };

  const deleteComment = async (commentId, commenterId) => {
    const isAllowed =
      commenterId === currentUserId ||
      post.user_id === currentUserId ||
      (post.group_id !== null && post.group_admin_id === currentUserId);

    if (!isAllowed) return; 

    await axios.delete(
      `http://localhost:4000/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    setComments(comments.filter(c => c.comment_id !== commentId));
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {post.group_id
            ? `#${post.group_name}`
            : post.username} – {new Date(post.timestamp).toLocaleString()}
        </Typography>

        <Typography paragraph>{post.caption}</Typography>

        {post.workout?.exercises?.map((ex, i) => (
          <Box key={i} mb={1} p={1} border={1} borderRadius={1}>
            <Typography><strong>{ex.name}</strong></Typography>
            <Typography>Weight: {ex.weight}</Typography>
            <Typography>Reps: {ex.reps}, Sets: {ex.sets}</Typography>
          </Box>
        ))}

        {post.media?.map(m => (
          <Box key={m.media_id} mt={2}>
            {m.media_type === 'image' ? (
              <img
                src={`data:${m.mime_type};base64,${m.data}`}
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <video controls style={{ maxWidth: '100%' }}>
                <source src={`data:${m.mime_type};base64,${m.data}`} />
              </video>
            )}
          </Box>
        ))}

        {/* Likes */}
        <Box display="flex" alignItems="center" mt={2}>
          <IconButton onClick={toggleLike}>
            {likes.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography>{likes.count}</Typography>
        </Box>

        {/* Comments */}
        <Box mt={2}>
          {comments.map(c => (
            <Box key={c.comment_id} mb={1}>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={c.profile_picture}
                  sx={{ mr: 1, width: 24, height: 24 }}
                />
                <Typography variant="caption" fontWeight="bold">
                  {c.username}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {new Date(c.timestamp).toLocaleString()}
                </Typography>
                <Box flexGrow={1} />
                <Button
                  size="small"
                  onClick={() => deleteComment(c.comment_id, c.user_id)}
                >
                  Delete
                </Button>
              </Box>
              <Typography variant="body2" sx={{ ml: 5 }}>
                {c.content}
              </Typography>
            </Box>
          ))}

          <Box display="flex" mt={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a comment…"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <Button onClick={submitComment}>Post</Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
