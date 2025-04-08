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
    const token = jwt.sign({ id: user.id }, SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Protected route
app.get("/profile", authenticateToken, async (req, res) => {
  const user = await pool.query("SELECT id, username FROM users WHERE id = $1", [req.user.id]);
  res.json(user.rows[0]);
});

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(403);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(4000, () => console.log("Backend server running on port 4000"));
