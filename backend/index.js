import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import logger from "./src/utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    logger.info("Database connected successfully");

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
