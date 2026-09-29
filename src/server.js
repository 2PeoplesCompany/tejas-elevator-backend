import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import inquiryRoutes from "./routes/inquiry.routes.js";
import amcRoutes from "./routes/amc.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  "https://tejas-elevator-frontend.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app");
      callback(null, isAllowed);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// JSON & URL-encoded body limit to prevent payload-based Denial of Service (DoS)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Zero-dependency in-memory rate limiter to protect public forms & auth endpoints
const rateLimitCache = new Map();
const rateLimiter = (maxRequests = 30, windowMs = 60 * 1000) => (req, res, next) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "client";
  const key = `${clientIp}:${req.baseUrl || req.path}`;
  const now = Date.now();

  const record = rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  rateLimitCache.set(key, record);

  // Auto garbage collection of stale entries
  if (rateLimitCache.size > 5000) {
    for (const [k, v] of rateLimitCache.entries()) {
      if (now > v.resetTime) rateLimitCache.delete(k);
    }
  }

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait a minute before trying again.",
    });
  }
  next();
};

// Root Welcome & Status
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Tejas Elevator Engineering REST API",
    status: "online",
    healthCheck: "/api/health",
    endpoints: {
      inquiries: "POST /api/inquiries",
      amc: "POST /api/amc",
      admin: "/api/admin",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Tejas Elevator Engineering REST API",
    version: "1.0.0",
    officer: "Engineering Consultation Desk (+91 93487 83051)",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes with Rate Limiting Protection
app.use("/api/inquiries", rateLimiter(20, 60000), inquiryRoutes);
app.use("/api/amc", rateLimiter(20, 60000), amcRoutes);
app.use("/api/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Server Error]:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 TEJAS ELEVATOR BACKEND SERVER ACTIVE`);
    console.log(`📍 Listening on: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
