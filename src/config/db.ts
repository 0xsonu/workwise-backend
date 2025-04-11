import { Pool } from "pg";
import { config } from "./config";
import logger from "../utils/logger";

// Determine connection configuration
const dbConfig = config.POSTGRES_DB_URL
  ? { connectionString: config.POSTGRES_DB_URL }
  : {
      user: config.POSTGRES_USER,
      host: config.POSTGRES_HOST,
      database: config.POSTGRES_DB,
      password: config.POSTGRES_PASSWORD,
      port: config.POSTGRES_PORT,
    };

export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info("✅ Database connection successful");
    if (config.POSTGRES_DB_URL) {
      logger.info(`Connected using database URL`);
    } else {
      logger.info(
        `Connected to ${config.POSTGRES_DB} at ${config.POSTGRES_HOST}:${config.POSTGRES_PORT}`
      );
    }
    client.release();
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
  }
};
