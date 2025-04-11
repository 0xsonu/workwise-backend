import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  bookSeats,
  cancelBooking,
  getSeating,
} from "../controllers/seat.controller";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getSeating(req, res);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/book",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await bookSeats(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/cancel",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cancelBooking(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
