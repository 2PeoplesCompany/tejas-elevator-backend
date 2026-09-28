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
app.use(express.json());

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

// Mount Routes
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/amc", amcRoutes);
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
