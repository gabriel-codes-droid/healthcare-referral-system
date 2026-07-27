require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, seedDB, resetDB } = require('./db');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const referralRoutes = require('./routes/referrals');
const appointmentRoutes = require('./routes/appointments');
const labRoutes = require('./routes/labs');
const hospitalRoutes = require('./routes/hospitals');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Sympra Healthcare API' });
});

app.post('/api/seed', async (_req, res) => {
  await seedDB();
  res.json({ message: 'Database seeded successfully' });
});

app.post('/api/reset', async (_req, res) => {
  await resetDB();
  res.json({ message: 'Database reset successfully' });
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

async function startServer() {
  try {
    await connectDB();
    await seedDB();
    app.listen(PORT, () => {
      console.log(`Sympra API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
