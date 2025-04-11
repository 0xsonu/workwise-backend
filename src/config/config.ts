import { getEnv } from "../utils/getEnv";
import dotenv from "dotenv";

dotenv.config();

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: Number(getEnv("PORT", "8000")),
  POSTGRES_USER: getEnv("POSTGRES_USER"),
  POSTGRES_PASSWORD: getEnv("POSTGRES_PASSWORD"),
  POSTGRES_DB: getEnv("POSTGRES_DB"),
  POSTGRES_HOST: getEnv("POSTGRES_HOST", "localhost"),
  POSTGRES_PORT: Number(getEnv("POSTGRES_PORT", "5432")),
});

export const config = appConfig();
