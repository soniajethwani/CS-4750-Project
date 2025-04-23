// src/pages/UserProfile.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
} from "@mui/material";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const res = await axios.get(`http://localhost:4000/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProfile(res.data);
    };
    fetchUserProfile();
  }, [id]);

  if (!profile) return <Typography>Loading…</Typography>;

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          src={
            profile.profile_picture
              ? `data:image/jpeg;base64,${profile.profile_picture}`
              : undefined
          }
          sx={{ width: 72, height: 72, mr: 2 }}
        />
        <Box>
          <Typography variant="h5">{profile.username}</Typography>
          <Typography color="text.secondary">
            {profile.follower_count} followers • {profile.following_count} following
          </Typography>
          <Typography mt={1}>{profile.biography || "No bio provided."}</Typography>
        </Box>
      </Box>
        {profile.privacy_setting === "private" ? (
        <Typography mt={4} color="text.secondary">
            This profile is private. Posts are hidden.
        </Typography>
        ) : (
        <Box mt={4}>
            {profile.posts.length > 0 ? (
            profile.posts.map((post) => (
                <Card key={post.post_id} sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="caption" color="text.secondary">
                    {new Date(post.timestamp).toLocaleString()}
                    </Typography>
                    <Typography>{post.caption}</Typography>
                </CardContent>
                </Card>
            ))
            ) : (
            <Typography color="text.secondary">No posts yet.</Typography>
            )}
        </Box>
        )}
    </Box>
  );
}
