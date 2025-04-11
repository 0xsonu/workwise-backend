import { Request, Response } from "express";
import { bookingSchema, cancellationSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/authMiddleware";
import { pool } from "../config/db";
import logger from "../utils/logger";

// Helper to find contiguous free seats in a row
const findContiguousSeats = async (
  row: number,
  required: number,
  client: any
) => {
  const seatsRes = await client.query(
    "SELECT id, seat_number FROM seats WHERE row_number = $1 AND booked_by IS NULL ORDER BY seat_number",
    [row]
  );
  const seats = seatsRes.rows;
  let contiguous: any[] = [];

  for (let i = 0; i < seats.length; i++) {
    contiguous = [seats[i]];
    let current = seats[i].seat_number;
    for (let j = i + 1; j < seats.length && contiguous.length < required; j++) {
      if (seats[j].seat_number === current + 1) {
        contiguous.push(seats[j]);
        current = seats[j].seat_number;
      } else {
        contiguous = [];
        break;
      }
    }
    if (contiguous.length === required) return contiguous;
  }
  return null;
};

export const bookSeats = async (req: AuthRequest, res: Response) => {
  const { numberOfSeats } = req.body;
  const parsed = bookingSchema.safeParse({ numberOfSeats });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let bookedSeats: any[] = [];

    // 1. Try each row (ordered by row_number) to find contiguous seats
    const rowsRes = await client.query(
      "SELECT DISTINCT row_number FROM seats ORDER BY row_number"
    );
    const rows = rowsRes.rows.map((row: any) => row.row_number);
    for (const row of rows) {
      const contiguous = await findContiguousSeats(row, numberOfSeats, client);
      if (contiguous) {
        // Lock and update seats
        const seatIds = contiguous.map((s: any) => s.id);
        await client.query(
          "UPDATE seats SET booked_by = $1, booked_at = NOW() WHERE id = ANY($2::int[])",
          [userId, seatIds]
        );
        bookedSeats = contiguous;
        break;
      }
    }

    // 2. If no single row can fulfill the contiguous requirement,
    // then book the nearest available seats (ordered by row and seat number)
    if (bookedSeats.length === 0) {
      const freeRes = await client.query(
        "SELECT id FROM seats WHERE booked_by IS NULL ORDER BY row_number, seat_number LIMIT $1 FOR UPDATE",
        [numberOfSeats]
      );
      if (freeRes.rows.length < numberOfSeats) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Not enough seats available" });
      }
      const seatIds = freeRes.rows.map((seat: any) => seat.id);
      await client.query(
        "UPDATE seats SET booked_by = $1, booked_at = NOW() WHERE id = ANY($2::int[])",
        [userId, seatIds]
      );
      bookedSeats = freeRes.rows;
    }

    await client.query("COMMIT");

    res.json({ data: { message: "Seats booked successfully", bookedSeats } });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Booking error:", error);
    res.status(500).json({ data: { error: "Booking failed" } });
  } finally {
    client.release();
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const parsed = cancellationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ data: { error: parsed.error.errors } });
  }
  const { seatIds } = parsed.data;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ data: { error: "Unauthorized" } });

  try {
    // Only allow cancellation of seats booked by the user
    const result = await pool.query(
      "UPDATE seats SET booked_by = NULL, booked_at = NULL WHERE id = ANY($1::int[]) AND booked_by = $2 RETURNING id",
      [seatIds, userId]
    );
    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "No seats updated. Check seat IDs and ownership." });
    }
    res.json({
      message: "Cancellation successful",
      canceledSeats: result.rows,
    });
  } catch (error) {
    logger.error("Cancellation error:", error);
    res.status(500).json({ data: { error: "Cancellation failed" } });
  }
};

export const getSeating = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, row_number, seat_number, booked_by FROM seats ORDER BY row_number, seat_number"
    );
    res.json({ data: { seats: result.rows } });
  } catch (error) {
    logger.error("Get seating error:", error);
    res
      .status(500)
      .json({ data: { error: "Failed to get seating information" } });
  }
};
