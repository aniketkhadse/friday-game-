"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateTypingMetrics,
  CHALLENGE_PARAGRAPH,
  ROUND_SECONDS,
  TypingMetrics,
} from "@/utils/game";

type TypingRaceProps = {
  roundEndsAt: number | null;
  onFinish: (metrics: TypingMetrics) => void;
  onProgress: (metrics: TypingMetrics) => void;
};

export function TypingRace({ roundEndsAt, onFinish, onProgress }: TypingRaceProps) {
  const [typed, setTyped] = useState("");
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [isLocked, setIsLocked] = useState(false);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  void onProgress;

  const metrics = useMemo(
    () => calculateTypingMetrics(CHALLENGE_PARAGRAPH, typed, (Date.now() - startedAt.current) / 1000),
    [typed],
  );

  const finish = useCallback(
    (finalTyped: string) => {
      if (finished.current) return;
      finished.current = true;
      setIsLocked(true);
      const elapsedSeconds = Math.min(ROUND_SECONDS, (Date.now() - startedAt.current) / 1000);
      onFinish(calculateTypingMetrics(CHALLENGE_PARAGRAPH, finalTyped, elapsedSeconds));
    },
    [onFinish],
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const targetEnd = roundEndsAt ?? startedAt.current + ROUND_SECONDS * 1000;
      const nextRemaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setRemaining(nextRemaining);

      if (nextRemaining <= 0) {
        finish(typed);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [finish, roundEndsAt, typed]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (finished.current) return;
      const value = event.target.value.slice(0, CHALLENGE_PARAGRAPH.length);
      setTyped(value);

      if (value === CHALLENGE_PARAGRAPH) {
        finish(value);
      }
    },
    [finish],
  );

  return (
    <section className="mx-auto w-full max-w-5xl select-none">
      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Time" value={`${remaining}s`} />
        <Metric label="WPM" value={metrics.wpm.toFixed(1)} />
        <Metric label="Accuracy" value={`${metrics.accuracy.toFixed(1)}%`} />
        <Metric label="Progress" value={`${metrics.progress.toFixed(0)}%`} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Paragraph typed={typed} />
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
            style={{ width: `${metrics.progress}%` }}
          />
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={typed}
        onChange={handleChange}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
        disabled={isLocked}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="mt-5 h-36 w-full resize-none rounded-lg border border-slate-300 bg-white p-4 text-lg leading-8 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
        placeholder="Start typing here..."
        aria-label="Typing input"
      />
    </section>
  );
}

const Paragraph = memo(function Paragraph({ typed }: { typed: string }) {
  const characters = useMemo(() => CHALLENGE_PARAGRAPH.split(""), []);

  return (
    <p className="select-none text-xl leading-10 text-slate-500">
      {characters.map((char, index) => {
        const input = typed[index];
        let className = "text-slate-400";

        if (input != null) {
          className = input === char ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700";
        } else if (index === typed.length) {
          className = "border-b-2 border-slate-900 text-slate-900";
        }

        return (
          <span className={`${className} rounded-sm px-[1px]`} key={`${char}-${index}`}>
            {char}
          </span>
        );
      })}
    </p>
  );
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
