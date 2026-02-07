import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import purchaseRoutes from './routes/purchase.routes';
import userRoutes from './routes/user.routes'; // For dashboard stats

// Load env vars (needed for CLIENT_URL)
dotenv.config();

const app: Express = express();

// --- Middleware ---

// 1. CORS (Cross-Origin Resource Sharing)
// This allows your frontend (running on http://localhost:3000)
// to make requests to your backend (running on http://localhost:5000)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));

// 2. JSON Body Parser
// This allows Express to read 'body' data from JSON requests
app.use(express.json());

// 3. URL-Encoded Parser (optional, but good to have)
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// All authentication routes will be prefixed with /api/auth
app.use('/api/auth', authRoutes);

// All purchase-related routes will be prefixed with /api/purchase
app.use('/api/purchase', purchaseRoutes);

// All user/dashboard routes will be prefixed with /api/user
app.use('/api/user', userRoutes);

// --- Health Check ---
// A simple route to check if the server is up and running
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is healthy!' });
});

// Export the app instance to be used by server.ts
export default app;