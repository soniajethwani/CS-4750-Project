import React, { useState, useEffect } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';



function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
    console.log("Modal state set to open");
  };

  const handleClose = () => {
    setOpen(false);
    console.log("Modal state set to close");
  };



  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:4000/register", { username, password });
      alert("Registered successfully!");
    } catch (err) {
      alert(err.response.data.error);
    }
  };

  const handleLogin = async () => {
      try {
        const res = await axios.post("http://localhost:4000/login", { username, password });
        const token = res.data.token;
        localStorage.setItem("token", token);
        setToken(token);
        alert("Logged in!");
      } catch (err) {
        alert("Login failed");
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      setToken(null);
      setProfile(null);
      alert("Logged out");
    };

  const getProfile = async () => {
    try {
      const res = await axios.get("http://localhost:4000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      console.log("calling Modal open function");
      handleClickOpen(); 
      console.log("Modal open function called");
    } catch (err) {
      alert("Failed to fetch profile");
      console.error(err);
    }
  };
  

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh" 
      bgcolor="#f7f7f7"
    >
      <Box 
        bgcolor="white" 
        p={4} 
        borderRadius={2} 
        boxShadow={3} 
        width={400} 
        textAlign="center"
      >
        <Typography variant="h5" gutterBottom>
          {token ? "Welcome!" : "Login / Register"}
        </Typography>
  
        {!token ? (
          <>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleLogin}
                fullWidth
                style={{ marginRight: "10px" }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleRegister}
                fullWidth
              >
                Register
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={getProfile} 
              fullWidth 
              style={{ marginBottom: "10px" }}
            >
              Get Profile
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleLogout} 
              fullWidth
            >
              Logout
            </Button>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>User Profile</DialogTitle>
              <DialogContent>
                <Typography><strong>User ID:</strong> {profile?.user_id}</Typography>
                <Typography><strong>Username:</strong> {profile?.username}</Typography>
                <Typography><strong>Biography:</strong> {profile?.biography}</Typography>
                <Typography><strong>Privacy:</strong> {profile?.privacy_setting}</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
            
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
// {profile && (
//   <Box mt={4} textAlign="left">
//     <Typography variant="h6" gutterBottom>
//       User Profile
//     </Typography>
//     <Typography><strong>User ID:</strong> {profile.user_id}</Typography>
//     <Typography><strong>Username:</strong> {profile.username}</Typography>
//     <Typography><strong>Biography:</strong> {profile.biography}</Typography>
//     <Typography><strong>Privacy:</strong> {profile.privacy_setting}</Typography>
//     {/* {profile.profile_picture && (
//       <Box mt={2} display="flex" justifyContent="center">
//         <img
//           src={profile.profile_picture}
//           alt="Profile"
//           style={{ width: 100, height: 100, borderRadius: "50%" }}
//         />
//       </Box>
//     )} */}
//   </Box>
// )}