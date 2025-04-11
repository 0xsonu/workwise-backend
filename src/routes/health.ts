import express, { Router, Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

const router: Router = Router();

/**
 * Health check endpoint that supports both GET and HEAD requests
 * This is used by clients to verify if the server is operational
 * HEAD requests are handled for lightweight connectivity checks
 */
router.head("/", (_req: Request, res: Response) => {
  // Using verbose instead of debug to ensure it works with the default logger configuration
  logger.info("Health check performed (HEAD)");
  res.status(200).end();
});

router.get("/", ((req: Request, res: Response) => {
  logger.info("Health check performed (GET)");
  return res.json({ status: "ok", uptime: process.uptime() });
}) as unknown as express.RequestHandler);

export default router;
