const express = require("express");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const fetch = require('node-fetch');
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SECRET = process.env.JWT_SECRET;

// Helper function to convert file to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.readFile(file.path, (err, data) => {
      if (err) reject(err);
      resolve(data.toString('base64'));
    });
  });
};

// Helper function to fetch complete post data
async function getPostById(client, post_id) {
  const postRes = await client.query(
    `SELECT p.*, 
     json_agg(
       DISTINCT jsonb_build_object(
         'media_id', m.media_id,
         'media_type', m.media_type,
         'mime_type', m.mime_type,
         'file_size', m.file_size,
         'data', m.media_data
       )
     ) as media,
     (SELECT json_build_object(
        'workout_id', w.workout_id,
        'date', w.date,
        'exercises', (
          SELECT json_agg(
            json_build_object(
              'name', e.name,
              'target_muscle', e.target_muscle,
              'weight', we.weight,
              'reps', we.reps,
              'sets', we.sets
            )
          )
          FROM workout_exercises we
          JOIN exercises e ON we.exercise_id = e.exercise_id
          WHERE we.workout_id = w.workout_id
        )
      ) FROM workout w WHERE w.post_id = p.post_id) as workout
     FROM posts p
     LEFT JOIN media m ON p.post_id = m.post_id
     WHERE p.post_id = $1
     GROUP BY p.post_id`,
    [post_id]
  );
  return postRes.rows[0];
}

// Function to fetch and store ALL exercises from API Ninjas
async function populateAllExercises() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if we need to populate (only if no predefined exercises exist)
    const { rows } = await client.query(
      `SELECT COUNT(*) FROM exercises WHERE created_by IS NULL`
    );
    
    if (parseInt(rows[0].count) > 0) {
      console.log('Predefined exercises already exist');
      return;
    }

    console.log('Fetching all exercises from API Ninjas...');
    
    const muscleGroups = [
      'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
      'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
      'lower_back', 'middle_back', 'neck', 'quadriceps', 'traps', 'triceps'
    ];

    let allExercises = [];
    
    for (const muscle of muscleGroups) {
      const response = await fetch(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`,
        { headers: { 'X-Api-Key': process.env.API_NINJAS_KEY } }
      );
      const exercises = await response.json();
      allExercises = [...allExercises, ...exercises];
      console.log(`Fetched ${exercises.length} exercises for ${muscle}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    const uniqueExercises = Array.from(new Set(allExercises.map(e => e.name)))
      .map(name => allExercises.find(e => e.name === name));

    console.log(`Inserting ${uniqueExercises.length} unique exercises...`);

    const batchSize = 50;
    for (let i = 0; i < uniqueExercises.length; i += batchSize) {
      const batch = uniqueExercises.slice(i, i + batchSize);
      const values = batch.map(ex => [
        ex.name,
        ex.muscle,
        ex.equipment || 'bodyweight',
        ex.instructions || '',
        null // created_by = null for predefined
      ]);

      await client.query(
        `INSERT INTO exercises 
         (name, target_muscle, equipment, instructions, created_by)
         SELECT * FROM UNNEST($1::varchar[], $2::varchar[], $3::text[], $4::text[], $5::int[])`,
        [
          values.map(v => v[0]),
          values.map(v => v[1]),
          values.map(v => v[2]),
          values.map(v => v[3]),
          values.map(v => v[4])
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Successfully populated predefined exercises');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error populating exercises:', err);
  } finally {
    client.release();
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)", 
      [username, hash]
    );
    res.status(201).send("User created");
  } catch (err) {
    res.status(400).json({ error: "User already exists or DB error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userRes = await pool.query(
    "SELECT * FROM users WHERE username = $1", 
    [username]
  );
  const user = userRes.rows[0];
  
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.user_id, username: user.username }, SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, profile_picture, biography, privacy_setting 
       FROM users WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
       json_agg(
         DISTINCT jsonb_build_object(
           'media_id', m.media_id,
           'media_type', m.media_type,
           'mime_type', m.mime_type,
           'file_size', m.file_size,
           'data', m.media_data
         )
       ) as media,
       (SELECT json_build_object(
          'workout_id', w.workout_id,
          'date', w.date,
          'exercises', (
            SELECT json_agg(
              json_build_object(
                'name', e.name,
                'target_muscle', e.target_muscle,
                'weight', we.weight,
                'reps', we.reps,
                'sets', we.sets
              )
            )
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.exercise_id
            WHERE we.workout_id = w.workout_id
          )
        ) FROM workout w WHERE w.post_id = p.post_id) as workout
       FROM posts p
       LEFT JOIN media m ON p.post_id = m.post_id
       WHERE p.user_id = $1
       GROUP BY p.post_id
       ORDER BY p.timestamp DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Posts fetch error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post("/posts", authenticateToken, upload.single('media'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { caption, exercises } = req.body;
    const userId = req.user.id;
    const parsedExercises = JSON.parse(exercises);

    // Create post
    const postInsert = await client.query(
      `INSERT INTO posts (user_id, caption) 
       VALUES ($1, $2) 
       RETURNING post_id, timestamp`,
      [userId, caption]
    );
    const { post_id, timestamp } = postInsert.rows[0];

    // Create workout
    const workoutInsert = await client.query(
      `INSERT INTO workout (post_id, user_id, date) 
       VALUES ($1, $2, CURRENT_DATE) 
       RETURNING workout_id`,
      [post_id, userId]
    );
    const workout_id = workoutInsert.rows[0].workout_id;

    // Process exercises
    for (const ex of parsedExercises) {
      let exercise_id;
      
      // For existing exercises, verify ownership if user-created
      if (ex.exercise_id) {
        const ownershipCheck = await client.query(
          `SELECT exercise_id FROM exercises 
           WHERE exercise_id = $1 AND (created_by IS NULL OR created_by = $2)`,
          [ex.exercise_id, userId]
        );
        
        if (ownershipCheck.rows.length === 0) {
          throw new Error('Unauthorized to use this exercise');
        }
        exercise_id = ex.exercise_id;
      } 
      // For new exercises
      else {
        const exerciseRes = await client.query(
          `INSERT INTO exercises 
           (name, target_muscle, equipment, instructions, created_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING exercise_id`,
          [
            ex.name,
            ex.muscle || null,
            ex.equipment || 'bodyweight',
            ex.instructions || '',
            userId
          ]
        );
        
        if (exerciseRes.rows.length === 0) {
          // Exercise already exists (predefined or by another user)
          const existing = await client.query(
            `SELECT exercise_id FROM exercises WHERE name = $1`,
            [ex.name]
          );
          exercise_id = existing.rows[0].exercise_id;
        } else {
          exercise_id = exerciseRes.rows[0].exercise_id;
        }
      }

      await client.query(
        `INSERT INTO workout_exercises 
         (workout_id, exercise_id, weight, reps, sets) 
         VALUES ($1, $2, $3, $4, $5)`,
        [workout_id, exercise_id, ex.weight || null, ex.reps, ex.sets]
      );
    }

    // Handle media
    if (req.file) {
      const mediaData = await fileToBase64(req.file);
      const fileType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      
      await client.query(
        `INSERT INTO media 
         (post_id, media_data, media_type, mime_type, file_size) 
         VALUES ($1, $2, $3, $4, $5)`,
        [post_id, mediaData, fileType, req.file.mimetype, req.file.size]
      );
    }

    await client.query('COMMIT');
    const newPost = await getPostById(client, post_id);
    res.status(201).json(newPost);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Single exercise endpoint that combines DB and API results
app.get("/api/exercises", authenticateToken, async (req, res) => {
  try {
    const { muscle } = req.query;
    const userId = req.user.id;
    
    // Get from database first (predefined + user's custom exercises)
    const dbExercises = await pool.query(
      `SELECT exercise_id, name, target_muscle, equipment 
       FROM exercises 
       WHERE created_by IS NULL OR created_by = $1
       ${muscle ? 'AND target_muscle = $2' : ''}
       ORDER BY name`,
      muscle ? [userId, muscle] : [userId]
    );
    
    // If no results in DB for this muscle, try API
    if (muscle && dbExercises.rows.length === 0) {
      const response = await fetch(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`,
        { headers: { 'X-Api-Key': process.env.API_NINJAS_KEY } }
      );
      const apiExercises = await response.json();
      res.json(apiExercises);
    } else {
      res.json(dbExercises.rows);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

// Initialize server
app.listen(4000, async () => {
  console.log("Backend server running on port 4000");
  
  // Pre-populate ALL exercises from API (only if none exist)
  await populateAllExercises();
});