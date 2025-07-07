import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

// Global Prisma client instance
let prisma;

/**
 * Create and configure Prisma client
 */
export const createPrismaClient = () => {
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "info", emit: "event" },
      { level: "warn", emit: "event" }
    ]
  });

  // Log queries in development
  if (process.env.NODE_ENV === "development") {
    prisma.$on("query", e => {
      logger.debug("Prisma Query:", {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`
      });
    });
  }

  // Log errors
  prisma.$on("error", e => {
    logger.error("Prisma Error:", e);
  });

  return prisma;
};

/**
 * Get Prisma client instance
 */
export const getPrisma = () => {
  if (!prisma) {
    return createPrismaClient();
  }
  return prisma;
};

/**
 * Connect to database and verify connection
 */
export const connectDB = async () => {
  try {
    const client = createPrismaClient();

    // Test connection
    await client.$connect();

    // Verify database is accessible
    const result = await client.$queryRaw`SELECT NOW() as now`;
    logger.info("Database connection established with Prisma:", result[0]);

    return client;
  } catch (error) {
    logger.error("Failed to connect to database with Prisma:", error);
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info("Database connection closed");
  }
};

export const rawQuery = async (query, ...params) => {
  const client = getPrisma();
  try {
    const result = await client.$queryRaw`${query}`;
    return result;
  } catch (error) {
    logger.error("Raw query error:", { query, params, error: error.message });
    throw error;
  }
};

// Export the singleton instance
export default getPrisma;
