import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;
let listeners = 0;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socket.on("connect", () => console.log("[WS] Connected:", socket!.id));
    socket.on("disconnect", (reason) => console.log("[WS] Disconnected:", reason));
    socket.on("error", (err) => console.error("[WS] Error:", err));
  }
  return socket;
}

export function useWebSocket() {
  const s = getSocket();
  return {
    socket: s,
    // ── Frame events ──
    onFrameUpdate: (cb: (data: { frameId: string; slots: any[] }) => void) => {
      s.on("frame:updated", cb);
      return () => s.off("frame:updated", cb);
    },
    onFrameCreate: (cb: (data: { frame: any }) => void) => {
      s.on("frame:created", cb);
      return () => s.off("frame:created", cb);
    },
    onFrameDelete: (cb: (data: { frameId: string }) => void) => {
      s.on("frame:deleted", cb);
      return () => s.off("frame:deleted", cb);
    },
    // ── Session events ──
    onSessionUpdate: (cb: (data: { sessionId: string; status: string }) => void) => {
      s.on("session:updated", cb);
      return () => s.off("session:updated", cb);
    },
    // ── Emit ──
    emitFrameUpdate: (frameId: string, slots: any[]) => {
      s.emit("frame:updated", { frameId, slots });
    },
    emitFrameCreate: (frame: any) => {
      s.emit("frame:created", { frame });
    },
    emitFrameDelete: (frameId: string) => {
      s.emit("frame:deleted", { frameId });
    },
    emitSessionUpdate: (sessionId: string, status: string) => {
      s.emit("session:updated", { sessionId, status });
    },
  };
}