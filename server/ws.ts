import { createServer } from "http";
import { Server } from "socket.io";
import { parse } from "url";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

const PORT = parseInt(process.env.WS_PORT || "3001", 10);

// ── Connection ──
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // ── Frame events ──
  socket.on("frame:updated", (data: { frameId: string; slots: any[] }) => {
    console.log(`[WS] Frame updated: ${data.frameId}`);
    // Broadcast ke semua client kecuali sender
    socket.broadcast.emit("frame:updated", data);
  });

  socket.on("frame:created", (data: { frame: any }) => {
    console.log(`[WS] Frame created: ${data.frame?.name}`);
    socket.broadcast.emit("frame:created", data);
  });

  socket.on("frame:deleted", (data: { frameId: string }) => {
    console.log(`[WS] Frame deleted: ${data.frameId}`);
    socket.broadcast.emit("frame:deleted", data);
  });

  // ── Session events ──
  socket.on("session:updated", (data: { sessionId: string; status: string }) => {
    console.log(`[WS] Session ${data.sessionId} → ${data.status}`);
    socket.broadcast.emit("session:updated", data);
  });

  // ── Heartbeat ──
  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("disconnect", (reason) => {
    console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
  });
});

// ── Health check endpoint ──
httpServer.on("request", (req, res) => {
  const { pathname } = parse(req.url || "", true);
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", clients: io.engine.clientsCount }));
    return;
  }
  res.writeHead(404);
  res.end();
});

httpServer.listen(PORT, () => {
  console.log(`[WS] Socket.io server running on port ${PORT}`);
});

export { io, httpServer };