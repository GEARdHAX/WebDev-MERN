import dotenv from 'dotenv';
dotenv.config(); // Must be at the very top to load .env variables

import app from './app';
import connectDB from './config/db';

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Connect to database and then start the server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();