/**
 * Companion Socket.IO server for live messaging.
 * Run: node server/messaging-ws.mjs  (or npm run messaging:ws)
 */

import http from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../.env.local") });

const PORT = Number(process.env.MESSAGING_WS_PORT || 3001);
const SECRET =
  process.env.MESSAGING_WS_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-ws-secret";
const CORS_ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/internal/emit") {
    const headerSecret = req.headers["x-ws-secret"];
    if (headerSecret !== SECRET) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    try {
      const { event, payload } = JSON.parse(body || "{}");
      if (!event || !payload) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "event and payload required" }));
        return;
      }

      const rooms = new Set();
      if (payload.conversationId) {
        rooms.add(`conversation:${payload.conversationId}`);
      }
      if (payload.userId) {
        rooms.add(`user:${payload.userId}`);
      }
      if (payload.assignedToId) {
        rooms.add(`staff:${payload.assignedToId}`);
      }
      rooms.add("staff:inbox");

      for (const room of rooms) {
        io.to(room).emit(event, payload);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, rooms: [...rooms] }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid payload" }));
    }
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "messaging-ws" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: [CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const auth = socket.handshake.auth || {};
  if (auth.kind === "user" && auth.userId) {
    socket.data.kind = "user";
    socket.data.userId = auth.userId;
    return next();
  }
  if (
    auth.kind === "staff" &&
    auth.teamMemberId &&
    (auth.role === "SUPER_ADMIN" || auth.role === "CUSTOMER_SUPPORT")
  ) {
    socket.data.kind = "staff";
    socket.data.teamMemberId = auth.teamMemberId;
    socket.data.role = auth.role;
    return next();
  }
  return next(new Error("Unauthorized"));
});

io.on("connection", (socket) => {
  if (socket.data.kind === "user") {
    socket.join(`user:${socket.data.userId}`);
  } else if (socket.data.kind === "staff") {
    socket.join(`staff:${socket.data.teamMemberId}`);
    socket.join("staff:inbox");
  }

  socket.on("conversation:join", (conversationId) => {
    if (typeof conversationId === "string" && conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    if (typeof conversationId === "string" && conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[messaging-ws] listening on http://127.0.0.1:${PORT}`);
});
