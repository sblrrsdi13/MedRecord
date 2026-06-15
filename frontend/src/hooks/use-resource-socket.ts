"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { emitResourceChanged } from "@/utils/resource-events";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let resourceSocket: Socket | null = null;
let loading = false;
let subscribers = 0;

export function useResourceSocket() {
  useEffect(() => {
    let active = true;
    subscribers += 1;

    if (!resourceSocket && !loading) {
      loading = true;
      import("socket.io-client")
        .then(({ io }) => {
          if (!active && subscribers <= 0) return;
          resourceSocket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
          resourceSocket.on("resource:changed", (payload: { resource?: string }) => {
            if (payload.resource) emitResourceChanged(payload.resource);
          });
          resourceSocket.on("cms:updated", () => {
            emitResourceChanged("settings");
          });
        })
        .finally(() => {
          loading = false;
        });
    }

    return () => {
      active = false;
      subscribers = Math.max(0, subscribers - 1);
      if (subscribers === 0) {
        resourceSocket?.disconnect();
        resourceSocket = null;
      }
    };
  }, []);
}
