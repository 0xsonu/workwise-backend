import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import seatRoutes from "./routes/seats";
import healthRoutes from "./routes/health";
import logger from "./utils/logger";
import { Request, Response, NextFunction } from "express";
import { testConnection } from "./config/db";

// Extend the Error type to include a status property
interface CustomError extends Error {
  status?: number;
}

const app = express();

// Initialize connection test
testConnection();

// Enable CORS for all routes with all origins allowed
app.use(
  cors({
    origin: "*", // Allow all origins
    credentials: true,
  })
);

app.use(express.json());

// Middleware to log incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `Outgoing Response: ${req.method} ${req.url} - ${res.statusCode} [${duration}ms]`
    );
  });

  next();
});

// Mount routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/seats", seatRoutes);

// Global error handler (should be after routes)
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;
