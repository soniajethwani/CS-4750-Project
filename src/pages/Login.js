import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      // check username length
      if(username.length <3){
        // post error to require more 
        alert("Username must contain at least three letters");
        return;
      }
      const regex = /^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+$/;

      // check password length
      if(password.length <=3 || !regex.test(password)){
        // post error about password requirement
        alert("Password must contain at least one number, at least one uppercase, and at least one lowercase letter");
        return;
      }

      await axios.post("http://localhost:4000/register", { username, password });
      alert("Registered successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      const res = await axios.post("http://localhost:4000/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/feed");
    } catch (err) {
      alert("Login failed");
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
          Login / Register
        </Typography>
        <form onSubmit = {handleLogin}> 
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
            type = "submit"
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
        </form>
      </Box>
    </Box>
  );
}

export default Login;