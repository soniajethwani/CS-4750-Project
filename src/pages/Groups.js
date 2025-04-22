// src/pages/Groups.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";

export default function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [feed, setFeed] = useState([]);
  const [open, setOpen] = useState(false);

  // form fields for new group
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");
      // fetch membership list
      const [listRes, feedRes] = await Promise.all([
        axios.get("http://localhost:4000/groups", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:4000/groups/feed", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMyGroups(listRes.data);
      setFeed(feedRes.data);
    };
    loadData();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setPrivacy("public");
    setOpen(false);
  };

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:4000/groups",
        { group_name: groupName, description, privacy_setting: privacy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // reload both lists
      const [listRes, feedRes] = await Promise.all([
        axios.get("http://localhost:4000/groups", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:4000/groups/feed", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMyGroups(listRes.data);
      setFeed(feedRes.data);
      handleClose();
    } catch (err) {
      console.error("Create group failed:", err);
    }
  };

  return (
    <Box p={4} pb={10}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Your Groups</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Create New Group
        </Button>
      </Box>

      {/* Your group memberships as Chips */}
      <Box mb={4}>
        {myGroups.map((g) => (
          <Chip
            key={g.group_id}
            label={g.group_name}
            clickable
            onClick={() => {}}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
        {myGroups.length === 0 && (
          <Typography color="text.secondary">You’re not in any groups yet.</Typography>
        )}
      </Box>

      {/* Modal Dialog for Creating Group */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            label="Group Name"
            fullWidth
            sx={{ mt: 1 }}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            fullWidth
            sx={{ mt: 2 }}
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!groupName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feed of posts from your groups */}
      <Box mt={4}>
        {feed.map((post) => (
          <Card key={post.post_id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                #{post.group_name} •{" "}
                {new Date(post.timestamp).toLocaleString()}
              </Typography>
              <Typography paragraph>{post.caption}</Typography>
              {post.workout?.exercises.map((ex, i) => (
                <Box key={i} mb={1} p={1} border={1} borderRadius={1}>
                  <Typography>
                    <strong>{ex.name}</strong>
                  </Typography>
                  <Typography>
                    Weight: {ex.weight} – Reps: {ex.reps}, Sets: {ex.sets}
                  </Typography>
                </Box>
              ))}
              {post.media?.map((m) => (
                <Box key={m.media_id} mt={2}>
                  {m.media_type === "image" ? (
                    <img
                      src={`data:${m.mime_type};base64,${m.data}`}
                      alt=""
                      style={{ maxWidth: "100%" }}
                    />
                  ) : (
                    <video controls style={{ maxWidth: "100%" }}>
                      <source
                        src={`data:${m.mime_type};base64,${m.data}`}
                      />
                    </video>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
        {feed.length === 0 && (
          <Typography color="text.secondary">
            No posts in your groups yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
