const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/todoapp', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gmail.com',
      phoneNumber: '1234567890',
      password: 'pass123',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 