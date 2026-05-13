import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import reportRoutes from "./routes/report";
import alertRoutes from "./routes/alerts"; // ← WAS MISSING

dotenv.config();
connectDB();

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "5mb" }));

// Global rate limit — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limit on auth routes — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later." },
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes); // ← REGISTERED

// ── Health Check (real one) ───────────────────────────────────
import mongoose from "mongoose";
app.get("/health", (_, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const status = dbStatus === "connected" ? "ok" : "degraded";
  res.status(dbStatus === "connected" ? 200 : 503).json({ status, db: dbStatus });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERROR]", err.message, err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EcoGuard API running on port ${PORT} [${process.env.NODE_ENV}]`));