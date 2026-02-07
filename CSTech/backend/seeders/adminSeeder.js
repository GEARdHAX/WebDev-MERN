/**
 * Admin User Seeder
 * Creates a default admin user for the application
 * Run: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Default admin user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin@123',
  role: 'admin',
};

// Seed function
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('   Email:', adminUser.email);
      console.log('   Use the existing password or delete the user to re-seed');
    } else {
      // Create admin user
      await User.create(adminUser);
      console.log('✅ Admin user created successfully');
      console.log('   Email:', adminUser.email);
      console.log('   Password:', adminUser.password);
    }

    console.log('\n📌 You can now login with these credentials');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedAdmin();
