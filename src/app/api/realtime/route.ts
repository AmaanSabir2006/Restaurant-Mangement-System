import { NextResponse } from "next/server";
import { realtimeEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`)
      );

      const onMessage = (event: any) => {
        try {
          const payload = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might have closed
        }
      };

      // Periodic heartbeat to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: "keep-alive"\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      realtimeEmitter.on("message", onMessage);

      // Clean up when client disconnects
      return () => {
        clearInterval(interval);
        realtimeEmitter.off("message", onMessage);
      };
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
