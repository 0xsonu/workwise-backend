import { Router, Request, Response, NextFunction } from "express";
import { signup, login, getCurrentUser } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await signup(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await login(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getCurrentUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
