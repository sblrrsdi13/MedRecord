import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { env } from "../config/env.js";

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("queue:join", (polyclinicId?: string) => {
      socket.join(polyclinicId ? `queue:${polyclinicId}` : "queue:all");
    });

    socket.on("queue:leave", (polyclinicId?: string) => {
      socket.leave(polyclinicId ? `queue:${polyclinicId}` : "queue:all");
    });
  });

  return io;
}

export function emitQueueEvent(event: string, payload: { polyclinicId: string; [key: string]: unknown }) {
  if (!io) return;
  io.to("queue:all").emit(event, payload);
  io.to(`queue:${payload.polyclinicId}`).emit(event, payload);
}

export function emitNotificationEvent(event: string, payload: { recipientId: string; [key: string]: unknown }) {
  if (!io) return;
  io.emit(event, payload);
}

export function emitCmsEvent(payload: { settings: unknown }) {
  if (!io) return;
  io.emit("cms:updated", payload);
}
