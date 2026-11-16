import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

type Options = {
  enabled: boolean;
  intervalMs?: number;
  onTick: () => Promise<void> | void;
};

/**
 * Foreground-only polling for inbox (no Socket.IO on mobile MVP).
 */
export function useForegroundPolling({
  enabled,
  intervalMs = 4000,
  onTick,
}: Options) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let appState: AppStateStatus = AppState.currentState;

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
        void run();
      }, intervalMs);
    };

    const run = async () => {
      if (cancelled || inFlight || appState !== "active") {
        schedule();
        return;
      }
      inFlight = true;
      try {
        await tickRef.current();
      } catch {
        // Next tick retries.
      } finally {
        inFlight = false;
        schedule();
      }
    };

    schedule();

    const sub = AppState.addEventListener("change", (next) => {
      appState = next;
      if (next === "active") {
        clearTimer();
        void run();
      }
    });

    return () => {
      cancelled = true;
      clearTimer();
      sub.remove();
    };
  }, [enabled, intervalMs]);
}
