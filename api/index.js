// api/index.js - Vercel Serverless Function Entry Point
import express from 'express';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import connectPg from 'connect-pg-simple';
import ws from 'ws';
import { registerRoutes } from '../server/routes.js';
import * as schema from '../shared/schema.js';

// Configure Neon WebSockets
const neonConfig = {
  webSocketConstructor: ws
};

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Set up session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool,
  createTableIfMissing: true 
});

// Configure session
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'formscript-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Register API routes
registerRoutes(app).then(server => {
  // Error handling middleware
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });
});

// Export for Vercel
export default app;