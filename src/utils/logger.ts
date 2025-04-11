import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure the log directory exists
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";

const transports = isProduction
  ? [
      new winston.transports.File({
        filename: path.join(logDir, `server.log`),
        level: "info",
      }),
    ]
  : [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} : [${level.toUpperCase()}] : ${message}`;
          })
        ),
      }),
    ];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} : [${level.toUpperCase()}] : ${message}`;
    })
  ),
  transports,
  exceptionHandlers: isProduction
    ? [
        new winston.transports.File({
          filename: path.join(logDir, `server_exceptions.log`),
        }),
      ]
    : [],
  rejectionHandlers: isProduction
    ? [
        new winston.transports.File({
          filename: path.join(logDir, `server_rejections.log`),
        }),
      ]
    : [],
});

export default logger;
