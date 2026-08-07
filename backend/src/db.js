const mongoose = require('mongoose');
const dns = require('node:dns');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-referral-system';

// Some ISP/network resolvers refuse MongoDB Atlas SRV queries. Set this in
// .env (for example 8.8.8.8 or 1.1.1.1) to use a known DNS resolver instead.
if (process.env.MONGODB_DNS_SERVER) {
  dns.setServers(process.env.MONGODB_DNS_SERVER.split(',').map((server) => server.trim()));
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedDB() {
  const User = require('./models/User');
  const Patient = require('./models/Patient');
  const Hospital = require('./models/Hospital');
  const Doctor = require('./models/Doctor');

  // Check if data already exists
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already has data - skipping seed');
    return;
  }

  // No default seeding - users will create their own data
  console.log('Database ready - no default data seeded');
}

async function resetDB() {
  await mongoose.connection.dropDatabase();
  await seedDB();
}

module.exports = { connectDB, seedDB, resetDB };
