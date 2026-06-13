import "express-async-errors";
import "./types/express.js";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { createServer } from "node:http";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { sanitizeBody } from "./middleware/sanitize.middleware.js";
import { apiRoutes } from "./routes.js";
import { initSocket } from "./socket/socket.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());
app.use(hpp());
app.use(compression());
app.use(sanitizeBody);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => res.json({ success: true, message: "Clinic EMR API is healthy" }));
app.use("/api/v1", apiRoutes);
app.use(notFound);
app.use(errorHandler);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
