const express = require('express');
const jwt = require('jsonwebtoken');
const { readDb } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, organization: user.organization },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

router.post('/signup', (req, res) => {
  const { name, email, password, role, organization } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const db = readDb();
  const existingUser = db.users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role: role || 'clinic',
    organization: organization || 'Independent',
    avatar: `https://i.pravatar.cc/80?u=${email}`
  };

  db.users.push(newUser);
  const { writeDb } = require('../db');
  writeDb(db);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name, organization: newUser.organization },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

module.exports = router;
