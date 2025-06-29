import pkg from "pg";
import logger from "../utils/logger.js";

const { Pool } = pkg;
let pool;

export const createPool = () => {
  if (pool) {
    return pool;
  }
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "inventory_db",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
  pool.on("error", err => {
    logger.error("Unexpected error on idle client", err);
    process.exit(-1);
  });
  return pool;
};

export const getPool = () => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

export const connectDB = async () => {
  try {
    const dbPool = createPool();
    const client = await dbPool.connect();
    const result = await client.query("SELECT NOW()");
    logger.info("Database connection established:", result.rows[0]);
    client.release();
    await createTables();
    return dbPool;
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    throw error;
  }
};

export const query = async (text, params) => {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug("Executed query", {
      text: text.replace(/\s+/g, " ").trim(),
      duration,
      rows: result.rowCount
    });
    return result;
  } catch (error) {
    logger.error("Query error:", { text, params, error: error.message });
    throw error;
  }
};

const createTables = async () => {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    `);

    // Create trigger for updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    logger.info("Database tables created/verified successfully");
  } catch (error) {
    logger.error("Error creating tables:", error);
    throw error;
  }
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    logger.info("Database pool closed");
  }
};
