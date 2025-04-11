import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { signupSchema, loginSchema } from "../utils/validators";
import { pool } from "../config/db";
import logger from "../utils/logger";
import { AuthRequest } from "../middleware/authMiddleware";
import { config } from "../config/config";

const saltRounds = 10;

export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ data: { error: parsed.error.errors } });
    }

    const { email, password, name } = parsed.data;

    // Check if user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ data: { error: "User already exists" } });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    res.status(201).json({ data: { user } });
  } catch (error) {
    logger.error("Signup error:", error);
    res.status(500).json({ data: { error: "Server error" } });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ data: { error: parsed.error.errors } });
    }

    const { email, password } = parsed.data;

    // Special handling for development mode test credentials
    // This matches the client-side behavior for development mode
    if (
      config.NODE_ENV === "development" &&
      email === "test@example.com" &&
      password === "password"
    ) {
      logger.info("Development mode: Using test credentials");
      const token = jwt.sign(
        { id: 999, email: "test@example.com" },
        (process.env.JWT_SECRET as string) || "dev-secret-key",
        {
          expiresIn: "1d",
        }
      );

      return res.json({
        data: {
          token,
          id: 999,
          name: "developer",
          devMode: true,
        },
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user)
      return res.status(400).json({ data: { error: "Invalid credentials" } });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass)
      return res.status(400).json({ data: { error: "Invalid credentials" } });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      data: { token, name: user.name, email: user.email, id: user.id },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ data: { error: "Server error" } });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ data: { error: "Not authenticated" } });
    }

    // Special handling for development mode test user
    if (config.NODE_ENV === "development" && req.user.id === 999) {
      return res.json({
        data: {
          user: {
            id: 999,
            email: "test@example.com",
            devMode: true,
          },
        },
      });
    }

    const result = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ data: { error: "User not found" } });
    }

    const user = result.rows[0];
    res.json({ data: { user } });
  } catch (error) {
    logger.error("Get current user error:", error);
    res.status(500).json({ data: { error: "Server error" } });
  }
};
