"use client";

/**
 * Vercel-friendly live inbox updates via HTTP polling (primary transport).
 * No separate WebSocket host required.
 */

import { useEffect, useRef } from "react";

type PollOptions = {
  /** When false, polling is paused */
  enabled: boolean;
  /** Poll interval in ms (default 4000) */
  intervalMs?: number;
  /** Refresh conversation list */
  refreshList: () => Promise<void> | void;
  /** Refresh active thread (messages) when a conversation is open */
  refreshThread?: () => Promise<void> | void;
  /** Active conversation id — when set, thread is polled too */
  activeConversationId?: string | null;
};

export function useMessagingPolling({
  enabled,
  intervalMs = 4000,
  refreshList,
  refreshThread,
  activeConversationId,
}: PollOptions) {
  const listRef = useRef(refreshList);
  const threadRef = useRef(refreshThread);
  listRef.current = refreshList;
  threadRef.current = refreshThread;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      if (cancelled) return;
      clearTimer();
      timer = setTimeout(() => {
        void tick();
      }, intervalMs);
    };

    const tick = async () => {
      if (cancelled || inFlight) {
        schedule();
        return;
      }
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        schedule();
        return;
      }

      inFlight = true;
      try {
        await listRef.current();
        if (activeConversationId && threadRef.current) {
          await threadRef.current();
        }
      } catch {
        // Silent — next tick will retry
      } finally {
        inFlight = false;
        schedule();
      }
    };

    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        clearTimer();
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, activeConversationId]);
}
