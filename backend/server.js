// backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SECRET = process.env.JWT_SECRET;

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
    res.status(201).send("User created");
  } catch (err) {
    res.status(400).json({ error: "User already exists or DB error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  const user = userRes.rows[0];
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, profile_picture, biography, privacy_setting FROM users WHERE username = $1",
      [req.user.username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
      console.log("No token provided");
      return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          return res.sendStatus(403);
      }
      req.user = user;
      next();
  });
}

app.listen(4000, () => console.log("Backend server running on port 4000"));
