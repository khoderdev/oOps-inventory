import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import rawMaterialRoutes from "./routes/rawMaterials.js";
import sectionsRoutes from "./routes/sections.js";
import stockRoutes from "./routes/stock.js";
import userRoutes from "./routes/users.js";
import logger from "./utils/logger.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.88.86:5173", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sections", sectionsRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
