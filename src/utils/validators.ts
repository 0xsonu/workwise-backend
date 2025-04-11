import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const bookingSchema = z.object({
  numberOfSeats: z.number().min(1).max(7),
});

export const cancellationSchema = z.object({
  seatIds: z.array(z.number().int().positive()).min(1),
});
