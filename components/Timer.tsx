"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TimerProps = {
  speakerName?: string;
  role?: string;
  minTimeSeconds: number;
  maxTimeSeconds: number;
};

type TimerPhase = "green" | "yellow" | "red";

const phaseStyles: Record<
  TimerPhase,
  {
    accent: string;
    badge: string;
    glow: string;
    ring: string;
    progress: string;
    label: string;
  }
> = {
  green: {
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    glow: "shadow-[0_0_80px_rgba(16,185,129,0.24)]",
    ring: "ring-emerald-200",
    progress: "from-emerald-400 to-emerald-600",
    label: "Within minimum time",
  },
  yellow: {
    accent: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    glow: "shadow-[0_0_80px_rgba(245,158,11,0.24)]",
    ring: "ring-amber-200",
    progress: "from-amber-300 to-amber-500",
    label: "Warning phase",
  },
  red: {
    accent: "text-rose-500",
    badge: "bg-rose-100 text-rose-700",
    glow: "shadow-[0_0_80px_rgba(244,63,94,0.24)]",
    ring: "ring-rose-200",
    progress: "from-rose-400 to-rose-600",
    label: "Overtime",
  },
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function Timer({
  speakerName = "Demo Speaker",
  role = "Speaker",
  minTimeSeconds,
  maxTimeSeconds,
}: TimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const storedElapsedRef = useRef(0);

  useEffect(() => {
    if (!isRunning) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return;
    }

    const tick = (timestamp: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = timestamp;
      }

      setElapsedMs(storedElapsedRef.current + (timestamp - startedAtRef.current));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const phase: TimerPhase = useMemo(() => {
    if (elapsedSeconds >= maxTimeSeconds) {
      return "red";
    }

    if (elapsedSeconds >= minTimeSeconds) {
      return "yellow";
    }

    return "green";
  }, [elapsedSeconds, maxTimeSeconds, minTimeSeconds]);

  const progressWidth = `${Math.min((elapsedSeconds / maxTimeSeconds) * 100, 100)}%`;
  const currentStyles = phaseStyles[phase];

  const handleStart = () => {
    if (isRunning) {
      storedElapsedRef.current = elapsedMs;
      startedAtRef.current = null;
      setIsRunning(false);
      return;
    }

    startedAtRef.current = null;
    setIsRunning(true);
  };

  const handleReset = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    startedAtRef.current = null;
    storedElapsedRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${currentStyles.badge}`}
            >
              {currentStyles.label}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-black/45">
                Active speaker
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                {speakerName}
              </h2>
              <p className="text-sm text-black/60">{role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-black/60">
            <div className="rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-black/40">Min</p>
              <p className="mt-2 font-mono text-lg text-black">
                {formatTime(minTimeSeconds)}
              </p>
            </div>
            <div className="rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-black/40">Max</p>
              <p className="mt-2 font-mono text-lg text-black">
                {formatTime(maxTimeSeconds)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`relative rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,245,239,0.96))] p-8 text-center ring-1 ${currentStyles.ring} transition-all duration-500 md:p-12 ${currentStyles.glow}`}
        >
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">
              Session timer
            </p>
            <div className="space-y-3">
              <p
                className={`font-mono text-6xl font-semibold tracking-[-0.08em] transition-colors duration-500 sm:text-7xl md:text-8xl ${currentStyles.accent}`}
              >
                {formatTime(elapsedSeconds)}
              </p>
              <p className="text-sm text-black/55">
                Smooth time tracking for live speeches, evaluations, and table topics.
              </p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-black/6">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${currentStyles.progress} transition-[width,background] duration-500`}
                style={{ width: progressWidth }}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex min-w-32 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-w-32 items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/[0.03]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}