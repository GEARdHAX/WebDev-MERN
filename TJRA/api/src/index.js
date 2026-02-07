const express = require('express');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./services/redisClient');
const analyticsRoutes = require('./routes/analytics');

require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to databases
connectDB();
connectRedis();

// Routes
app.use('/', analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API service listening on port ${PORT}`);
});