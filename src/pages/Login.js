import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:4000/login", {
        username,
        password
      });
      localStorage.setItem("token", res.data.token);
      navigate("/feed");
    } catch (err) {
      alert("Login failed: Username or password not registered.");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:4000/register", {
        username: registerUsername,
        password: registerPassword
      });
      localStorage.setItem("token", res.data.token);
      setOpenRegisterModal(false);
      navigate("/feed");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed.");
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
          Login
        </Typography>
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
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
            onClick={() => setOpenRegisterModal(true)}
            fullWidth
          >
            Register
          </Button>
        </Box>
      </Box>

      {/* Register Modal */}
      <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)}>
        <DialogTitle>Register</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="dense"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="dense"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRegisterModal(false)}>Cancel</Button>
          <Button onClick={handleRegister} variant="contained" color="primary">
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;
