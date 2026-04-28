"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getLevel2QuestionScore,
  isLevel2AnswerCorrect,
  LEVEL_2_QUESTIONS,
  LEVEL_2_SECONDS_PER_QUESTION,
} from "@/utils/game";

type Level2Result = {
  level2Score: number;
  level2Correct: number;
  level2Progress: number;
};

type IdentifyWordGameProps = {
  onProgress: (result: Level2Result) => void;
  onFinish: (result: Level2Result) => void;
};

type RevealState = {
  answer: string;
  wasCorrect: boolean;
} | null;

export function IdentifyWordGame({ onProgress, onFinish }: IdentifyWordGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [remainingMs, setRemainingMs] = useState(LEVEL_2_SECONDS_PER_QUESTION * 1000);
  const [reveal, setReveal] = useState<RevealState>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const questionStartedAt = useRef(Date.now());
  const locked = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  void onProgress;

  const question = LEVEL_2_QUESTIONS[questionIndex];
  const progress = useMemo(
    () => Math.round((questionIndex / LEVEL_2_QUESTIONS.length) * 100),
    [questionIndex],
  );

  const advance = useCallback(
    (delayMs: number) => {
      window.setTimeout(() => {
        const nextIndex = questionIndex + 1;
        const result = {
          level2Score: scoreRef.current,
          level2Correct: correctRef.current,
          level2Progress: Math.round((nextIndex / LEVEL_2_QUESTIONS.length) * 100),
        };

        if (nextIndex >= LEVEL_2_QUESTIONS.length) {
          onFinish({ ...result, level2Progress: 100 });
          return;
        }

        locked.current = false;
        questionStartedAt.current = Date.now();
        setQuestionIndex(nextIndex);
        setAnswer("");
        setReveal(null);
        setRemainingMs(LEVEL_2_SECONDS_PER_QUESTION * 1000);
        requestAnimationFrame(() => inputRef.current?.focus());
      }, delayMs);
    },
    [onFinish, questionIndex],
  );

  const finishQuestion = useCallback(
    (wasCorrect: boolean) => {
      if (locked.current) return;
      locked.current = true;

      const timeTaken = (Date.now() - questionStartedAt.current) / 1000;
      const questionScore = getLevel2QuestionScore(wasCorrect, timeTaken);
      scoreRef.current += questionScore;
      if (wasCorrect) correctRef.current += 1;

      setReveal(wasCorrect ? null : { answer: question.answer, wasCorrect });
      advance(wasCorrect ? 0 : 2500);
    },
    [advance, question.answer],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (locked.current) return;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - questionStartedAt.current;
      const nextRemaining = Math.max(0, LEVEL_2_SECONDS_PER_QUESTION * 1000 - elapsed);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        finishQuestion(false);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [finishQuestion, questionIndex]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (locked.current) return;
      const value = event.target.value.toUpperCase();
      setAnswer(value);

      if (isLevel2AnswerCorrect(question.answer, value)) {
        finishQuestion(true);
      }
    },
    [finishQuestion, question.answer],
  );

  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Identify the Word</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Question {questionIndex + 1}/{LEVEL_2_QUESTIONS.length}
          </h2>
        </div>
        <div className="rounded-lg bg-slate-950 px-4 py-3 text-center text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Timer</div>
          <div className="text-3xl font-black">{Math.ceil(remainingMs / 1000)}s</div>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Hint</p>
        <p className="mt-2 text-xl font-semibold leading-8 text-slate-900">{question.hint}</p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Word Pattern</p>
        <p className="mt-3 break-words font-mono text-4xl font-black tracking-[0.18em] text-slate-950">
          {question.pattern}
        </p>
      </div>

      <input
        ref={inputRef}
        value={answer}
        onChange={handleChange}
        onPaste={(event) => event.preventDefault()}
        disabled={locked.current}
        className="mt-8 h-14 w-full rounded-lg border border-slate-300 px-4 text-center text-2xl font-bold uppercase tracking-wide text-slate-950 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
        aria-label="Word answer"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />

      <div className="mt-5 min-h-8 text-center">
        {reveal ? (
          <p className="text-lg font-black text-rose-700">Correct Answer: {reveal.answer}</p>
        ) : (
          <p className="text-sm font-semibold text-slate-500">Wrong answer? Keep trying until the timer ends.</p>
        )}
      </div>
    </section>
  );
}
