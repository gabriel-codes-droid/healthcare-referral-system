const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-referral-system';

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
    console.log('Database already seeded');
    return;
  }

  // Seed users
  const users = [
    {
      name: 'Dr. Robert Fox',
      email: 'admin@sympra.com',
      password: 'admin123',
      role: 'admin',
      organization: 'Sympra Health Network',
      avatar: 'https://i.pravatar.cc/80?img=13'
    },
    {
      name: 'Dr. Sarah Wilson',
      email: 'clinic@sympra.com',
      password: 'clinic123',
      role: 'clinic',
      organization: 'City Clinic',
      avatar: 'https://i.pravatar.cc/80?img=5'
    },
    {
      name: 'Dr. Michael Brown',
      email: 'hospital@sympra.com',
      password: 'hospital123',
      role: 'hospital',
      organization: 'City Hospital',
      avatar: 'https://i.pravatar.cc/80?img=12'
    },
    {
      name: 'Dr. Emily Davis',
      email: 'lab@sympra.com',
      password: 'lab123',
      role: 'lab',
      organization: 'Metro Laboratory',
      avatar: 'https://i.pravatar.cc/80?img=44'
    }
  ];

  await User.insertMany(users);

  // Seed patients
  const patients = [
    {
      name: 'John Cooper',
      email: 'john.cooper@email.com',
      phone: '+1 555-0101',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      address: '123 Oak Street',
      avatar: 'https://i.pravatar.cc/80?img=32'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 555-0102',
      dateOfBirth: '1990-07-22',
      gender: 'Female',
      address: '456 Pine Avenue',
      avatar: 'https://i.pravatar.cc/80?img=47'
    }
  ];

  const savedPatients = await Patient.insertMany(patients);

  // Seed hospitals
  const hospitals = [
    { name: 'City Hospital', type: 'hospital', location: 'Downtown' },
    { name: 'Metro Hospital', type: 'hospital', location: 'West Side' },
    { name: 'City Clinic', type: 'clinic', location: 'Central' },
    { name: 'Health Plus', type: 'clinic', location: 'North District' },
    { name: 'Metro Laboratory', type: 'laboratory', location: 'Science Park' }
  ];

  const savedHospitals = await Hospital.insertMany(hospitals);

  // Seed doctors
  const doctors = [
    { name: 'Dr. Sarah Wilson', specialty: 'Cardiologist', rating: 4.9, avatar: 'https://i.pravatar.cc/80?img=5', hospitalId: savedHospitals[0]._id },
    { name: 'Dr. Michael Brown', specialty: 'Orthopedic Surgeon', rating: 4.8, avatar: 'https://i.pravatar.cc/80?img=12', hospitalId: savedHospitals[0]._id },
    { name: 'Dr. Emily Davis', specialty: 'Neurologist', rating: 4.7, avatar: 'https://i.pravatar.cc/80?img=44', hospitalId: savedHospitals[1]._id },
    { name: 'Dr. Albert Flores', specialty: 'General Surgeon', rating: 4.6, avatar: 'https://i.pravatar.cc/80?img=59', hospitalId: savedHospitals[1]._id }
  ];

  await Doctor.insertMany(doctors);

  console.log('Database seeded successfully');
}

async function resetDB() {
  await mongoose.connection.dropDatabase();
  await seedDB();
}

module.exports = { connectDB, seedDB, resetDB };
