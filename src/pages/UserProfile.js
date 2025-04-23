// src/pages/UserProfile.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Box, Typography, Avatar, Grid, Card, CardContent, Button, Link, ListItem, Dialog, List, DialogTitle, DialogContent } from "@mui/material";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  

  useEffect(() => {
    const fetchUserProfile = async () => {
      const res = await axios.get(`http://localhost:4000/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProfile(res.data);
    };
    fetchUserProfile();
  }, [id]);

  useEffect(() => {
    const tokenPayload = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    setCurrentUserId(tokenPayload.id);
  }, []);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      const res = await axios.get(`http://localhost:4000/is-following/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setIsFollowing(res.data.isFollowing);
    };
    if (id) fetchFollowStatus();
  }, [id]);
  useEffect(() => {
    const checkPendingRequest = async () => {
      const res = await axios.get(`http://localhost:4000/is-pending/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setPendingRequest(res.data.pending);
    };
    if (id) checkPendingRequest();
  }, [id]);

  if (!profile) return <Typography>Loading…</Typography>;
  
  const toggleFollow = async () => {
    const url = isFollowing ? `/unfollow/${id}` : `/follow/${id}`;
    await axios.post(`http://localhost:4000${url}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
  
    if (isFollowing) {
      setIsFollowing(false);
    } else {
      if (profile.privacy_setting === "private") {
        setPendingRequest(true);
      } else {
        setIsFollowing(true);
      }
    }
  };

  const fetchFollowData = async () => {
    const res = await axios.get(`http://localhost:4000/user-follow-data/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setFollowers(res.data.followers);
    setFollowing(res.data.following);
  };
  
  const handleFollowersOpen = async () => {
    await fetchFollowData();
    setFollowersOpen(true);
  };
  
  const handleFollowingOpen = async () => {
    await fetchFollowData();
    setFollowingOpen(true);
  };
  
  
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
            {(profile.privacy_setting === "public" || isFollowing) && !pendingRequest ? (
                <>
                <Link component="button" onClick={handleFollowersOpen}>
                    {profile.follower_count} followers
                </Link> •{" "}
                <Link component="button" onClick={handleFollowingOpen}>
                    {profile.following_count} following
                </Link>
                </>
            ) : (
                <>
                {profile.follower_count} followers • {profile.following_count} following
                </>
            )}
            </Typography>
          <Typography mt={1}>{profile.biography || "No bio provided."}</Typography>
        </Box>

      </Box>
       {currentUserId !== profile.user_id && (
            <Button 
                variant="contained" 
                onClick={toggleFollow} 
                disabled={pendingRequest}
            >
                {isFollowing
                ? "Unfollow"
                : pendingRequest
                    ? "Pending"
                    : profile.privacy_setting === "private"
                    ? "Request to Follow"
                    : "Follow"}
            </Button>
        )}
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
        <Dialog open={followersOpen} onClose={() => setFollowersOpen(false)}>
            <DialogTitle>Followers</DialogTitle>
            <DialogContent>
                <List>
                {followers.map(f => (
                    <ListItem key={f.user_id}>
                    <Typography>{f.username}</Typography>
                    </ListItem>
                ))}
                </List>
            </DialogContent>
            </Dialog>

            <Dialog open={followingOpen} onClose={() => setFollowingOpen(false)}>
            <DialogTitle>Following</DialogTitle>
            <DialogContent>
                <List>
                {following.map(f => (
                    <ListItem key={f.user_id}>
                    <Typography>{f.username}</Typography>
                    </ListItem>
                ))}
                </List>
            </DialogContent>
            </Dialog>
    </Box>
  );
}
