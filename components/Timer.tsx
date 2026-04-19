"use client";

import { useEffect, useRef, useState } from "react";

type TimerProps = {
  minTime: number;
  maxTime: number;
  className?: string;
  // When these are omitted the timer runs in standalone (demo) mode
  isRunning?: boolean;
  startedAt?: string | null;
  pausedElapsedMs?: number;
  startedByLabel?: string | null;
  canControl?: boolean;
  startDisabledMessage?: string;
  onStart?: () => void;
  onPause?: (elapsedMs: number) => void;
  onReset?: () => void;
};

type TimerTone = "green" | "yellow" | "red";

const toneStyles: Record<
  TimerTone,
  {
    surface: string;
    glow: string;
    text: string;
    track: string;
    progress: string;
    badge: string;
  }
> = {
  green: {
    surface: "border-emerald-200/70 bg-white/88",
    glow: "shadow-[0_30px_90px_rgba(16,185,129,0.18)]",
    text: "text-emerald-600",
    track: "bg-emerald-100/80",
    progress: "from-emerald-400 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  yellow: {
    surface: "border-amber-200/80 bg-white/90",
    glow: "shadow-[0_30px_90px_rgba(245,158,11,0.18)]",
    text: "text-amber-500",
    track: "bg-amber-100/80",
    progress: "from-amber-300 to-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  red: {
    surface: "border-rose-200/80 bg-white/92",
    glow: "shadow-[0_30px_90px_rgba(244,63,94,0.18)]",
    text: "text-rose-500",
    track: "bg-rose-100/80",
    progress: "from-rose-400 to-rose-600",
    badge: "bg-rose-100 text-rose-700",
  },
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getTone(
  elapsedSeconds: number,
  minTime: number,
  maxTime: number,
): TimerTone {
  if (elapsedSeconds > maxTime) {
    return "red";
  }

  if (elapsedSeconds >= minTime) {
    return "yellow";
  }

  return "green";
}

export function Timer({
  minTime,
  maxTime,
  className,
  isRunning: serverIsRunning,
  startedAt,
  pausedElapsedMs = 0,
  startedByLabel,
  canControl = true,
  startDisabledMessage,
  onStart,
  onPause,
  onReset,
}: TimerProps) {
  const isServerDriven = onStart !== undefined;
  const minThreshold = Math.max(0, Math.floor(minTime));
  const maxThreshold = Math.max(minThreshold, Math.floor(maxTime));

  // Standalone mode: internal state
  const [standaloneRunning, setStandaloneRunning] = useState(false);
  const standaloneElapsedRef = useRef(0);

  const isRunning = isServerDriven ? (serverIsRunning ?? false) : standaloneRunning;

  const [displayMs, setDisplayMs] = useState(pausedElapsedMs);
  const displayMsRef = useRef(pausedElapsedMs);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (isRunning) {
      if (isServerDriven && startedAt) {
        const startedAtMs = new Date(startedAt).getTime();

        const tick = () => {
          const elapsed = pausedElapsedMs + (Date.now() - startedAtMs);

          displayMsRef.current = elapsed;
          setDisplayMs(elapsed);
          frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
      } else if (!isServerDriven) {
        // Standalone: tick from storedElapsed
        const startTs = performance.now();

        const tick = (now: number) => {
          const elapsed =
            standaloneElapsedRef.current + (now - startTs);

          displayMsRef.current = elapsed;
          setDisplayMs(elapsed);
          frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
      }
    } else {
      displayMsRef.current = pausedElapsedMs;
      setDisplayMs(pausedElapsedMs);
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startedAt, pausedElapsedMs, isServerDriven]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    if (isServerDriven) {
      onStart?.();
    } else {
      setStandaloneRunning(true);
    }
  };

  const handlePause = () => {
    if (!isRunning) return;

    if (isServerDriven) {
      onPause?.(displayMsRef.current);
    } else {
      standaloneElapsedRef.current = displayMsRef.current;
      setStandaloneRunning(false);
    }
  };

  const handleReset = () => {
    if (isServerDriven) {
      onReset?.();
    } else {
      standaloneElapsedRef.current = 0;
      displayMsRef.current = 0;
      setDisplayMs(0);
      setStandaloneRunning(false);
    }
  };

  const elapsedSeconds = Math.floor(displayMs / 1000);
  const tone = getTone(elapsedSeconds, minThreshold, maxThreshold);
  const progressWidth = `${Math.min((elapsedSeconds / maxThreshold) * 100, 100)}%`;
  const currentStyles = toneStyles[tone];

  const statusLabel =
    tone === "green"
      ? "Below minimum time"
      : tone === "yellow"
        ? "Within target window"
        : "Past maximum time";

  return (
    <section
      className={`relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 overflow-hidden rounded-4xl border px-5 py-8 text-center transition-[border-color,box-shadow,background-color] duration-500 sm:px-6 sm:py-10 ${currentStyles.surface} ${currentStyles.glow} ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,255,255,0.72))]" />

      <div className="relative flex flex-col items-center gap-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] transition-colors duration-500 ${currentStyles.badge}`}
        >
          {statusLabel}
        </span>
        <p
          className={`font-mono text-[clamp(4.5rem,18vw,9rem)] font-semibold tracking-[-0.08em] transition-colors duration-500 ${currentStyles.text}`}
        >
          {formatTime(elapsedSeconds)}
        </p>
        {startedByLabel ? (
          <p className="text-sm text-black/55">
            Started by {startedByLabel}
          </p>
        ) : null}
      </div>

      <div className="relative w-full max-w-lg space-y-5">
        <div
          className={`h-2 overflow-hidden rounded-full ${currentStyles.track}`}
        >
          <div
            className={`h-full rounded-full bg-linear-to-r ${currentStyles.progress} transition-[width,background] duration-500`}
            style={{ width: progressWidth }}
          />
        </div>

        {canControl ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={isRunning}
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Start
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={!isRunning}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
            >
              Reset
            </button>
          </div>
        ) : (
          <p className="text-sm leading-7 text-black/56">
            {startDisabledMessage ??
              "Timer control is reserved for the session creator and evaluator."}
          </p>
        )}
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3 text-sm text-black/60">
        <div className="rounded-full border border-black/8 bg-white/70 px-4 py-2">
          Min {formatTime(minThreshold)}
        </div>
        <div className="rounded-full border border-black/8 bg-white/70 px-4 py-2">
          Max {formatTime(maxThreshold)}
        </div>
      </div>
    </section>
  );
}
