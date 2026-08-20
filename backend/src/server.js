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
const messageRoutes = require('./routes/messages');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const PORT = process.env.PORT || 5080;

// CORS configuration
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
  ? (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  : []; // dev: allow any localhost origin

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (isProd) {
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // Dev mode: accept any localhost / 127.0.0.1 origin (any port)
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocal) return callback(null, true);

    // Also allow file:// and Vite preview origins in dev
    if (origin === 'null' || origin.startsWith('http://localhost')) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

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
app.use('/api/messages', messageRoutes);
app.use('/api/audit-logs', auditLogRoutes);

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
