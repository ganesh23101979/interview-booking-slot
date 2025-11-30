import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';

import http from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();

// ===============================
// FRONTEND ORIGIN HANDLING
// ===============================
const FRONTEND_ORIGINS = process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173"];

console.log("Allowed CORS Origins:", FRONTEND_ORIGINS);

const server = http.createServer(app);

// ===============================
// SOCKET.IO
// ===============================
export const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }
});

// ===============================
// MIDDLEWARE
// ===============================
app.use(
  cors({
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// JSON Body parser
app.use(express.json());

// ===============================
// ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// ===============================
// SOCKET.IO Connections
// ===============================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Socket emit helper
export function notifyStudentApproved(studentId) {
  io.emit("student-approved", { studentId });
}

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 8080;

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return;

    let existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      const hashed = await bcrypt.hash(adminPassword, 10);

      await User.collection.insertOne({
        name: "Admin",
        email: adminEmail,
        phone: "-",
        course: "-",
        role: "admin",
        password: hashed,
        status: "approved",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Admin created successfully");
    }
  } catch (err) {
    console.error("Admin seed error", err);
  }
}

async function start() {
  await connectDB(process.env.MONGO_URI);
  await seedAdmin();

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
