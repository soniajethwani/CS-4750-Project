import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

export default function NewGroup() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.post(
      "http://localhost:4000/groups",
      {
        group_name: groupName,
        description: description,
        privacy_setting: privacy
      },
      headers
    );
    // after creation, go to the new group’s profile
    navigate(`/groups/${res.data.group_id}`);
  };

  return (
    <Box p={4} maxWidth="600px" mx="auto">
      <Typography variant="h4" gutterBottom>
        Create New Group
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Privacy</InputLabel>
          <Select
            value={privacy}
            label="Privacy"
            onChange={(e) => setPrivacy(e.target.value)}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
        <Box mt={2}>
          <Button type="submit" variant="contained" disabled={!groupName.trim()}>
            Create Group
          </Button>
        </Box>
      </form>
    </Box>
  );
}
