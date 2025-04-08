import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography } from "@mui/material";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);

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
      setToken(res.data.token);
      alert("Logged in!");
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setToken(null);
    alert("Logged out");
  };

  const getProfile = async () => {
    const res = await axios.get("http://localhost:4000/profile", {
      headers: { Authorization: token },
    });
    alert(`You are logged in as: ${res.data.username}`);
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
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
