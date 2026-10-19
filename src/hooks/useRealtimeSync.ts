"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { soundManager } from "@/lib/sound";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/realtime");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.addEventListener("connected", () => {
          setIsConnected(true);
        });

        eventSource.addEventListener("message", (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEvent(data.type);

            if (data.type === "ORDER_CREATED") {
              soundManager.playNewOrderChime();
              queryClient.invalidateQueries({ queryKey: ["orders"] });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
            } else if (data.type === "ORDER_STATUS_CHANGED") {
              queryClient.invalidateQueries({ queryKey: ["orders"] });
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
            } else if (data.type === "STOCK_UPDATED") {
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
            } else if (data.type === "PO_UPDATED") {
              queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
            }
          } catch (err) {
            console.error("Error processing SSE message:", err);
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Attempt reconnection after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  return { isConnected, lastEvent };
}
