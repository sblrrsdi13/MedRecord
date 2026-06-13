"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { QueueItem } from "@/types/api";
import { callQueueVoice, type QueueVoiceOptions } from "@/utils/queue-voice";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function useQueueSocket(options: { polyclinicId?: string; onUpdated?: () => void; voice?: boolean; voiceOptions?: QueueVoiceOptions }) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let mounted = true;
    let socket: Socket | null = null;

    import("socket.io-client")
      .then(({ io }) => {
        if (!mounted) return;
        socket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
        socket.emit("queue:join", options.polyclinicId);
        socket.on("queue:updated", () => optionsRef.current.onUpdated?.());
        socket.on("queue:created", () => optionsRef.current.onUpdated?.());
        socket.on("queue:called", (payload: { queue: QueueItem }) => {
          optionsRef.current.onUpdated?.();
          if (optionsRef.current.voice) callQueueVoice(payload.queue.queueNumber, payload.queue.polyclinic.name, optionsRef.current.voiceOptions);
        });
      })
      .catch(() => null);

    return () => {
      mounted = false;
      socket?.emit("queue:leave", options.polyclinicId);
      socket?.disconnect();
    };
  }, [options.polyclinicId]);
}



