"use client";

/**
 * Optional Socket.IO transport. Disabled unless NEXT_PUBLIC_MESSAGING_WS_URL is set.
 * Primary live updates use useMessagingPolling (Vercel-friendly).
 */

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type SocketAuth =
  | { kind: "user"; userId: string }
  | { kind: "staff"; teamMemberId: string; role: string };

type Handlers = {
  onMessageNew?: (payload: unknown) => void;
  onAssigned?: (payload: unknown) => void;
  onRead?: (payload: unknown) => void;
};

export function useMessagingSocket(
  auth: SocketAuth | null,
  handlers: Handlers,
  activeConversationId?: string | null
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const wsUrl = process.env.NEXT_PUBLIC_MESSAGING_WS_URL?.trim();

  useEffect(() => {
    if (!auth || !wsUrl) return;

    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      auth,
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("message:new", (payload) => {
      handlersRef.current.onMessageNew?.(payload);
    });
    socket.on("conversation:assigned", (payload) => {
      handlersRef.current.onAssigned?.(payload);
    });
    socket.on("conversation:read", (payload) => {
      handlersRef.current.onRead?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    auth?.kind,
    auth && "userId" in auth ? auth.userId : null,
    auth && "teamMemberId" in auth ? auth.teamMemberId : null,
    wsUrl,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId || !wsUrl) return;
    socket.emit("conversation:join", activeConversationId);
    return () => {
      socket.emit("conversation:leave", activeConversationId);
    };
  }, [activeConversationId, wsUrl]);
}
