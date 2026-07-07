const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET all events
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM events';
    let params = [];
    if (category && category !== 'All') {
      query += ' WHERE category = $1';
      params.push(category);
    }
    if (search) {
      query += params.length ? ' AND' : ' WHERE';
      query += ` title ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    query += ' ORDER BY date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE event (auth required)
router.post('/', auth, async (req, res) => {
  const { title, description, category, date, time, location, image_url, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO events (title, description, category, date, time, location, image_url, capacity, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, description, category, date, time, location, image_url, capacity, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// RSVP to event (auth required)
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2)',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'RSVP successful' });
  } catch (err) {
    res.status(400).json({ error: 'Already RSVPd' });
  }
});

// GET my RSVPs (auth required)
router.get('/user/myrsvps', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT events.* FROM events JOIN rsvps ON events.id = rsvps.event_id WHERE rsvps.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;