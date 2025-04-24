// src/pages/UserProfile.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Link
} from "@mui/material";
import PostCard from "../components/PostCard";

export default function UserProfile() {
  const { id } = useParams();                 // the profile we’re viewing
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);      // rich posts from /feed
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // —— NEW STATE FOR FOLLOW BUTTON ——
  const [isFollowing, setIsFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // Decode current user ID from JWT
  useEffect(() => {
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    setCurrentUserId(payload.id);
  }, [token]);

  // 1) Fetch basic profile info + follower counts
  useEffect(() => {
    async function loadProfile() {
      const res = await axios.get(`http://localhost:4000/users/${id}`, headers);
      setProfile(res.data);
    }
    loadProfile();
  }, [id]);

  // 2) Fetch the full feed and filter to just this user’s posts
  useEffect(() => {
    async function loadPosts() {
      const res = await axios.get("http://localhost:4000/feed", headers);
      const userPosts = res.data.filter(p => p.user_id === parseInt(id, 10));
      setPosts(userPosts);
    }
    loadPosts();
  }, [id]);

  // 3) Fetch follow status (only when viewing someone else)
  useEffect(() => {
    if (currentUserId && currentUserId !== parseInt(id, 10)) {
      axios.get(`http://localhost:4000/is-following/${id}`, headers)
        .then(res => setIsFollowing(res.data.isFollowing))
        .catch(console.error);
      axios.get(`http://localhost:4000/is-pending/${id}`, headers)
        .then(res => setPending(res.data.pending))
        .catch(console.error);
    }
  }, [id, currentUserId]);

  // Toggle follow/unfollow
  const toggleFollow = async () => {
    if (isFollowing) {
      await axios.post(`http://localhost:4000/unfollow/${id}`, {}, headers);
      setIsFollowing(false);
    } else {
      try {
        await axios.post(`http://localhost:4000/follow/${id}`, {}, headers);
        setIsFollowing(true);
      } catch (err) {
        // 202 = follow request pending
        if (err.response?.status === 202) setPending(true);
      }
    }
  };

  // Helpers to load followers / following lists
  const fetchFollowers = async () => {
    setFollowersOpen(true);
    const res = await axios.get(`http://localhost:4000/users/${id}/followers`, headers);
    setFollowers(res.data);
  };
  const fetchFollowingList = async () => {
    setFollowingOpen(true);
    const res = await axios.get(`http://localhost:4000/users/${id}/following`, headers);
    setFollowing(res.data);
  };

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

          {/* —— FOLLOW / UNFOLLOW BUTTON —— */}
          {currentUserId !== profile.user_id && (
            <Button
              variant={isFollowing ? "outlined" : "contained"}
              color={isFollowing ? "error" : "primary"}
              onClick={toggleFollow}
              disabled={pending}
              sx={{ mt: 1 }}
            >
              {isFollowing
                ? "Unfollow"
                : pending
                  ? "Pending"
                  : "Follow"}
            </Button>
          )}

          <Box display="flex" gap={2} mt={1}>
            <Link component="button" onClick={fetchFollowers}>
              {profile.follower_count} followers
            </Link>
            <Link component="button" onClick={fetchFollowingList}>
              {profile.following_count} following
            </Link>
          </Box>

          <Typography mt={1}>{profile.biography || "No bio provided."}</Typography>
        </Box>
      </Box>

      {/* POSTS */}
      <Box mt={4}>
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.post_id} post={post} />)
        ) : (
          <Typography color="text.secondary">
            {profile.privacy_setting === "private"
              ? "This profile is private. Posts are hidden."
              : "No posts yet."}
          </Typography>
        )}
      </Box>

      {/* FOLLOWERS DIALOG */}
      <Dialog open={followersOpen} onClose={() => setFollowersOpen(false)}>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          <List>
            {followers.map(u => (
              <ListItem key={u.user_id}>{u.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* FOLLOWING DIALOG */}
      <Dialog open={followingOpen} onClose={() => setFollowingOpen(false)}>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          <List>
            {following.map(u => (
              <ListItem key={u.user_id}>{u.username}</ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
