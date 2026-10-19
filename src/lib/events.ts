import { EventEmitter } from "events";

type RealtimeEventType = "ORDER_CREATED" | "ORDER_STATUS_CHANGED" | "STOCK_UPDATED" | "PO_UPDATED";

interface RealtimeEvent {
  type: RealtimeEventType;
  data: any;
  timestamp: string;
}

// Global emitter across requests in development and production
const globalForEvents = globalThis as unknown as {
  realtimeEmitter: EventEmitter | undefined;
};

export const realtimeEmitter =
  globalForEvents.realtimeEmitter ?? new EventEmitter();

realtimeEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.realtimeEmitter = realtimeEmitter;
}

export function broadcastRealtimeEvent(type: RealtimeEventType, data: any) {
  const event: RealtimeEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  realtimeEmitter.emit("message", event);
}
