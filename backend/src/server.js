require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { resetDb } = require('./db');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const referralRoutes = require('./routes/referrals');
const appointmentRoutes = require('./routes/appointments');
const labRoutes = require('./routes/labs');
const hospitalRoutes = require('./routes/hospitals');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Sympra Healthcare API' });
});

app.post('/api/seed', (_req, res) => {
  resetDb();
  res.json({ message: 'Database seeded successfully' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/hospitals', hospitalRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Sympra API running on http://localhost:${PORT}`);
});
