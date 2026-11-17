import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

type Options = {
  enabled: boolean;
  /** Base interval while polls succeed. */
  intervalMs?: number;
  /** Cap for exponential backoff after errors. */
  maxIntervalMs?: number;
  onTick: () => Promise<void> | void;
};

/**
 * Foreground-only polling with exponential backoff on failures.
 */
export function useForegroundPolling({
  enabled,
  intervalMs = 6000,
  maxIntervalMs = 60000,
  onTick,
}: Options) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let appState: AppStateStatus =
      (AppState.currentState as AppStateStatus | null) ?? "active";
    let delay = intervalMs;
    let failures = 0;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = (nextDelay: number) => {
      if (cancelled) return;
      clearTimer();
      timer = setTimeout(() => {
        void run();
      }, nextDelay);
    };

    const run = async () => {
      if (cancelled || inFlight || appState !== "active") {
        schedule(delay);
        return;
      }
      inFlight = true;
      try {
        await tickRef.current();
        failures = 0;
        delay = intervalMs;
      } catch {
        failures += 1;
        delay = Math.min(
          maxIntervalMs,
          intervalMs * Math.pow(2, Math.min(failures, 4))
        );
      } finally {
        inFlight = false;
        schedule(delay);
      }
    };

    schedule(intervalMs);

    const sub = AppState.addEventListener("change", (next) => {
      appState = next;
      if (next === "active") {
        delay = intervalMs;
        failures = 0;
        clearTimer();
        void run();
      }
    });

    return () => {
      cancelled = true;
      clearTimer();
      sub.remove();
    };
  }, [enabled, intervalMs, maxIntervalMs]);
}
