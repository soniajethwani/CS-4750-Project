const express = require("express");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cors = require("cors");
const bcrypt = require("bcryptjs");
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
    
    const { caption, exercises, group_id } = req.body;
    const userId = req.user.id;
    const parsedExercises = JSON.parse(exercises);

    // Create post
    const postInsert = await client.query(
      `INSERT INTO posts (user_id, caption, group_id) 
       VALUES ($1, $2, $3) 
       RETURNING post_id, timestamp`,
      [userId, caption, group_id || null]
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

// Enhanced profile endpoint that includes posts
app.get("/fullprofile", authenticateToken, async (req, res) => {
  try {
    // Get user profile

    const profileRes = await pool.query(`
      SELECT user_id, username, profile_picture, biography, privacy_setting,
        (SELECT COUNT(*) FROM followers WHERE followed_user_id = $1) AS followers,
        (SELECT COUNT(*) FROM followers WHERE follower_user_id = $1) AS following
      FROM users WHERE user_id = $1
    `, [req.user.id]);

    const groupsRes = await pool.query(`
      SELECT g.group_id, g.group_name FROM groups g
      JOIN group_members gm ON gm.group_id = g.group_id
      WHERE gm.user_id = $1
    `, [req.user.id]);

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's posts
    const postsRes = await pool.query(
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

    res.json({
      profile: profileRes.rows[0],
      groups: groupsRes.rows,
      posts: postsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get list of followers
app.get("/followers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.username
      FROM followers f
      JOIN users u ON f.follower_user_id = u.user_id
      WHERE f.followed_user_id = $1
      ORDER BY u.username
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch followers:", err);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Get list of users the current user is following
app.get("/following", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.username
      FROM followers f
      JOIN users u ON f.followed_user_id = u.user_id
      WHERE f.follower_user_id = $1
      ORDER BY u.username
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch following:", err);
    res.status(500).json({ error: "Failed to fetch following" });
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
       WHERE (created_by IS NULL OR created_by = $1)
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

// GET /feed — posts by users you follow or in your groups
app.get("/feed", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const feedRes = await client.query(
      `SELECT p.*,
              u.username,
              p.group_id,
              g.group_name,
              json_agg(DISTINCT jsonb_build_object(
                'media_id', m.media_id,
                'media_type', m.media_type,
                'mime_type', m.mime_type,
                'file_size', m.file_size,
                'data', m.media_data
              )) AS media,
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
               ) FROM workout w WHERE w.post_id = p.post_id) AS workout
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN groups g ON p.group_id = g.group_id
       LEFT JOIN media m ON p.post_id = m.post_id
       WHERE
         -- posts by users you follow or your own
         p.user_id = $1
         OR p.user_id IN (
           SELECT followed_user_id FROM followers WHERE follower_user_id = $1
         )
         -- OR posts in groups you’re a member of
         OR p.group_id IN (
           SELECT group_id FROM group_members WHERE user_id = $1
         )
       GROUP BY p.post_id, u.username, g.group_id, g.group_name
       ORDER BY p.timestamp DESC;`,
      [userId]
    );
    res.json(feedRes.rows);
  } catch (err) {
    console.error("Feed fetch error:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  } finally {
    client.release();
  }
});

// SEARCH USERS & GROUPS
// GET /search?q=foo
// Returns users whose username or biography match, and groups whose name or description match.
app.get("/search", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const q = `%${req.query.q || ""}%`;

    // users matching
    const usersRes = await client.query(
      `SELECT 
         u.user_id,
         u.username,
         u.profile_picture,
         u.biography,
         u.privacy_setting,
         (SELECT COUNT(*) FROM followers f WHERE f.followed_user_id = u.user_id)   AS follower_count,
         (SELECT COUNT(*) FROM followers f WHERE f.follower_user_id = u.user_id)  AS following_count
       FROM users u
       WHERE u.username ILIKE $1 OR u.biography ILIKE $1
       ORDER BY u.username
       LIMIT 50;`,
      [q]
    );

    // groups matching
    const groupsRes = await client.query(
      `SELECT
         g.group_id,
         g.group_name,
         g.description,
         g.privacy_setting,
         (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.group_id) AS member_count
       FROM groups g
       WHERE g.group_name ILIKE $1 OR g.description ILIKE $1
       ORDER BY g.group_name
       LIMIT 50;`,
      [q]
    );

    res.json({
      users: usersRes.rows,
      groups: groupsRes.rows,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  } finally {
    client.release();
  }
});

// GET /groups — list all groups the user is a member of
app.get("/groups", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT g.group_id,
              g.group_name,
              g.description,
              g.privacy_setting
       FROM groups g
       JOIN group_members gm ON g.group_id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.group_name;`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch user groups error:", err);
    res.status(500).json({ error: "Failed to fetch user groups" });
  } finally {
    client.release();
  }
});

// POST /groups — create a new group (and auto‑add creator as member)
app.post("/groups", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { group_name, description, privacy_setting } = req.body;
    await client.query("BEGIN");

    // 1) create the group
    const insertRes = await client.query(
      `INSERT INTO groups
         (group_name, description, privacy_setting, admin_id)
       VALUES ($1, $2, $3, $4)
       RETURNING group_id`,
      [group_name, description, privacy_setting, req.user.id]
    );
    const groupId = insertRes.rows[0].group_id;

    // 2) add creator as member
    await client.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [groupId, req.user.id]
    );

    await client.query("COMMIT");
    res.status(201).json({ group_id: groupId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  } finally {
    client.release();
  }
});

// GET /groups/feed — posts from groups you belong to
app.get("/groups/feed", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const feedRes = await client.query(
      `SELECT p.*,
              g.group_name,
              u.username,
              json_agg(DISTINCT jsonb_build_object(
                'media_id', m.media_id,
                'media_type', m.media_type,
                'mime_type', m.mime_type,
                'file_size', m.file_size,
                'data', m.media_data
              )) AS media,
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
               ) FROM workout w WHERE w.post_id = p.post_id) AS workout
       FROM posts p
       JOIN groups g   ON p.group_id = g.group_id
       JOIN users u    ON p.user_id = u.user_id
       LEFT JOIN media m ON p.post_id = m.post_id
       WHERE p.group_id IN (
         SELECT group_id FROM group_members WHERE user_id = $1
       )
       GROUP BY p.post_id, g.group_name, u.username
       ORDER BY p.timestamp DESC;`,
      [userId]
    );
    res.json(feedRes.rows);
  } catch (err) {
    console.error("Groups feed error:", err);
    res.status(500).json({ error: "Failed to fetch group feed" });
  } finally {
    client.release();
  }
});

// POST /groups/:id/join
app.post("/groups/:id/join", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [req.params.id, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Already a member or invalid group" });
  } finally {
    client.release();
  }
});

// POST /groups/:id/leave
app.post("/groups/:id/leave", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM group_members 
       WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Could not leave group" });
  } finally {
    client.release();
  }
});

// GET /groups/:id — full group profile
app.get("/groups/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const gid = req.params.id;
    const uid = req.user.id;

    // 1) group meta + membership status + counts
    const grpRes = await client.query(
      `SELECT 
         g.*,
         (SELECT COUNT(*) FROM group_members WHERE group_id = $1) AS member_count,
         EXISTS(
           SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
         ) AS is_member
       FROM groups g
       WHERE g.group_id = $1`,
      [gid, uid]
    );
    if (!grpRes.rows.length) return res.sendStatus(404);
    const group = grpRes.rows[0];

    // 2) list of members
    const memRes = await client.query(
      `SELECT u.user_id, u.username, u.profile_picture
       FROM users u
       JOIN group_members gm ON u.user_id = gm.user_id
       WHERE gm.group_id = $1`,
      [gid]
    );

    // 3) group-only posts
    const postsRes = await client.query(
      `SELECT p.*, u.username, 
              json_agg(DISTINCT jsonb_build_object(
                'media_id', m.media_id,
                'media_type', m.media_type,
                'mime_type', m.mime_type,
                'file_size', m.file_size,
                'data', m.media_data
              )) AS media,
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
               ) FROM workout w WHERE w.post_id = p.post_id) AS workout
       FROM posts p
       JOIN users u    ON p.user_id = u.user_id
       LEFT JOIN media m ON p.post_id = m.post_id
       WHERE p.group_id = $1
       GROUP BY p.post_id, u.username
       ORDER BY p.timestamp DESC`,
      [gid]
    );

    res.json({
      group,
      members: memRes.rows,
      posts: postsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load group profile" });
  } finally {
    client.release();
  }
});

//GET /users/:id — full user profile
app.get("/users/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;
  try {
    const profileRes = await pool.query(`
      SELECT user_id, username, profile_picture, biography, privacy_setting,
        (SELECT COUNT(*) FROM followers WHERE followed_user_id = $1) AS follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_user_id = $1) AS following_count
      FROM users WHERE user_id = $1
    `, [userId]);

    const postsRes = await pool.query(`
      SELECT p.*,
        json_agg(DISTINCT jsonb_build_object(
          'media_id', m.media_id,
          'media_type', m.media_type,
          'mime_type', m.mime_type,
          'file_size', m.file_size,
          'data', m.media_data
        )) AS media
      FROM posts p
      LEFT JOIN media m ON p.post_id = m.post_id
      WHERE p.user_id = $1
      GROUP BY p.post_id
      ORDER BY p.timestamp DESC
    `, [userId]);

    if (!profileRes.rows.length) return res.status(404).json({ error: "User not found" });

    res.json({ ...profileRes.rows[0], posts: postsRes.rows });
  } catch (err) {
    console.error("Error loading user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// send follow request
app.post("/follow/:targetId", authenticateToken, async (req, res) => {
  const { targetId } = req.params;
  const requesterId = req.user.id;

  const userRes = await pool.query(`SELECT privacy_setting FROM users WHERE user_id = $1`, [targetId]);
  const privacy = userRes.rows[0]?.privacy_setting;

  if (privacy === "public") {
    await pool.query(`INSERT INTO followers (follower_user_id, followed_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [requesterId, targetId]);
    return res.sendStatus(204);
  } else {
    await pool.query(`INSERT INTO follow_requests (requester_id, target_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [requesterId, targetId]);
    return res.status(202).json({ message: "Request sent" });
  }
});

// view requests
app.get("/follow-requests", authenticateToken, async (req, res) => {
  const requests = await pool.query(`
    SELECT u.user_id, u.username FROM follow_requests fr
    JOIN users u ON fr.requester_id = u.user_id
    WHERE fr.target_id = $1
  `, [req.user.id]);
  res.json(requests.rows);
});

// accept request
app.post("/follow-requests/:requesterId/accept", authenticateToken, async (req, res) => {
  const { requesterId } = req.params;
  const targetId = req.user.id;
  await pool.query('BEGIN');
  await pool.query(`DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2`, [requesterId, targetId]);
  await pool.query(`INSERT INTO followers (follower_user_id, followed_user_id) VALUES ($1, $2)`, [requesterId, targetId]);
  await pool.query('COMMIT');
  res.sendStatus(200);
});

//decline request
app.delete("/follow-requests/:requesterId/decline", authenticateToken, async (req, res) => {
  await pool.query(`DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2`, [req.params.requesterId, req.user.id]);
  res.sendStatus(204);
});

// check is following
app.get("/is-following/:id", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `SELECT 1 FROM followers WHERE follower_user_id = $1 AND followed_user_id = $2`,
    [req.user.id, req.params.id]
  );
  res.json({ isFollowing: result.rows.length > 0 });
});

//unfollow
app.post("/unfollow/:id", authenticateToken, async (req, res) => {
  await pool.query(
    `DELETE FROM followers WHERE follower_user_id = $1 AND followed_user_id = $2`,
    [req.user.id, req.params.id]
  );
  res.sendStatus(204);
});

//check pending
app.get("/is-pending/:id", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `SELECT 1 FROM follow_requests WHERE requester_id = $1 AND target_id = $2`,
    [req.user.id, req.params.id]
  );
  res.json({ pending: result.rows.length > 0 });
});

app.get("/user-follow-data/:id", authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const requesterId = req.user.id;

  const privacyRes = await pool.query(`SELECT privacy_setting FROM users WHERE user_id = $1`, [targetId]);
  const privacy = privacyRes.rows[0]?.privacy_setting;

  const isFollowingRes = await pool.query(`
    SELECT 1 FROM followers WHERE follower_user_id = $1 AND followed_user_id = $2
  `, [requesterId, targetId]);

  const isAllowed = privacy === "public" || isFollowingRes.rows.length > 0 || requesterId === parseInt(targetId);

  if (!isAllowed) return res.status(403).json({ error: "Access denied" });

  const followers = await pool.query(`
    SELECT u.user_id, u.username FROM followers f
    JOIN users u ON u.user_id = f.follower_user_id
    WHERE f.followed_user_id = $1
  `, [targetId]);

  const following = await pool.query(`
    SELECT u.user_id, u.username FROM followers f
    JOIN users u ON u.user_id = f.followed_user_id
    WHERE f.follower_user_id = $1
  `, [targetId]);

  res.json({ followers: followers.rows, following: following.rows });
});

// Initialize server
app.listen(4000, async () => {
  console.log("Backend server running on port 4000");
  
  // Pre-populate ALL exercises from API (only if none exist)
  await populateAllExercises();
});

// Graceful shutdown on Ctrl+C or kill signal
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  try {
    await pool.end(); // Close all DB connections
    console.log('Database connections closed.');
  } catch (err) {
    console.error('Error closing DB connections:', err);
  } finally {
    process.exit(0); // Exit process
  }
});

process.on('SIGTERM', async () => {
  console.log('\nGracefully shutting down...');
  try {
    await pool.end(); // Close all DB connections
    console.log('Database connections closed.');
  } catch (err) {
    console.error('Error closing DB connections:', err);
  } finally {
    process.exit(0);
  }
});
