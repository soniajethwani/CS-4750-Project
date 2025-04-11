import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  return (
    <Box p={4}>
      <Typography variant="h3" gutterBottom>
        Welcome, {username}!
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => navigate("/log-workout")}
      >
        Log Workout
      </Button>
    </Box>
  );
}

export default Profile;