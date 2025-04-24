import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import PostCard from "../components/PostCard";

export default function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [feed, setFeed] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch your groups *and* the full feed in parallel
      const [groupsRes, feedRes] = await Promise.all([
        axios.get("http://localhost:4000/groups", headers),
        axios.get("http://localhost:4000/feed",   headers),
      ]);

      setMyGroups(groupsRes.data);
      // Only keep posts whose group_id is one you belong to:
      const groupIds = new Set(groupsRes.data.map(g => g.group_id));
      setFeed(feedRes.data.filter(p => groupIds.has(p.group_id)));
    }
    loadData();
  }, []);

  return (
    <Box p={4} pb={10}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Your Groups</Typography>
        <Button variant="contained" onClick={() => navigate("/groups/new")}>
          Create New Group
        </Button>
      </Box>

      {/* Your group memberships */}
      <Box mb={4}>
        {myGroups.map(g => (
          <Chip
            key={g.group_id}
            label={g.group_name}
            clickable
            onClick={() => navigate(`/groups/${g.group_id}`)}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
        {myGroups.length === 0 && (
          <Typography color="text.secondary">
            You’re not in any groups yet.
          </Typography>
        )}
      </Box>

      {/* Feed of posts in your groups, with full comments + likes */}
      <Box>
        {feed.length > 0 ? (
          feed.map(post => (
            <PostCard key={post.post_id} post={post} />
          ))
        ) : (
          <Typography color="text.secondary">
            No posts in your groups yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
