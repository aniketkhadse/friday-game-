"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { IdentifyWordGame } from "@/components/IdentifyWordGame";
import { TypingRace } from "@/components/TypingRace";
import { useGamePolling } from "@/hooks/useGamePolling";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import { COUNTDOWN_SECONDS, TypingMetrics } from "@/utils/game";

type PlayerStep =
  | "landing"
  | "instructions"
  | "waiting"
  | "countdown"
  | "game"
  | "result"
  | "level2"
  | "level2Result"
  | "notQualified";

export function PlayerApp() {
  const { snapshot } = useGamePolling(850);
  const { player, setPlayer, join, syncPlayer } = useLocalPlayer();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<PlayerStep>("landing");
  const [finalMetrics, setFinalMetrics] = useState<TypingMetrics | null>(null);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!player?.id || !snapshot) return;
    const livePlayer = snapshot.players.find((candidate) => candidate.id === player.id);
    if (livePlayer) setPlayer(livePlayer);
  }, [player?.id, setPlayer, snapshot]);

  useEffect(() => {
    if (!player?.id || !snapshot) return;

    if (snapshot.gameState === "LEVEL2_STARTED") {
      if (player.level2Eligible && player.status !== "Finished") {
        setStep("level2");
        return;
      }

      if (player.level2Eligible && player.status === "Finished") {
        setStep("level2Result");
        return;
      }

      setStep("notQualified");
      return;
    }

    if (snapshot.gameState === "LEVEL2_ENDED") {
      setStep(player.level2Eligible ? "level2Result" : "notQualified");
      return;
    }

    if (snapshot.gameState === "COUNTDOWN" && snapshot.countdownEndsAt) {
      setStep("countdown");
      const secondsLeft = Math.max(1, Math.ceil((snapshot.countdownEndsAt - snapshot.serverNow) / 1000));
      setCountdownValue(secondsLeft);
      return;
    }

    if (snapshot.gameState === "STARTED" && player.status !== "Finished") {
      setStep("game");
      void syncPlayer({ status: "Playing" });
      return;
    }

    if (snapshot.gameState === "ENDED" || player.status === "Finished") {
      setStep("result");
    }
  }, [player?.id, player?.status, snapshot, syncPlayer]);

  useEffect(() => {
    if (step !== "countdown" || !snapshot?.countdownEndsAt) return;

    const timer = window.setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((snapshot.countdownEndsAt! - Date.now()) / 1000));
      setCountdownValue(secondsLeft);
      if (secondsLeft <= 0) {
        setStep("game");
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [snapshot?.countdownEndsAt, step]);

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your name to join.");
      return;
    }

    setError("");
    await join(cleanName);
    setStep("instructions");
  };

  const handleReady = async () => {
    await syncPlayer({ status: "Ready" });
    setStep("waiting");
  };

  const handleFinish = useCallback(
    (metrics: TypingMetrics) => {
      setFinalMetrics(metrics);
      setStep("result");
      void syncPlayer({ ...metrics, status: "Finished" });
    },
    [syncPlayer],
  );

  const handleProgress = useCallback(
    (metrics: TypingMetrics) => {
      void syncPlayer({ ...metrics, status: "Playing" });
    },
    [syncPlayer],
  );

  const resultMetrics = useMemo(
    () =>
      finalMetrics ?? {
        wpm: player?.wpm ?? 0,
        accuracy: player?.accuracy ?? 100,
        score: player?.score ?? 0,
        progress: player?.progress ?? 0,
        correctChars: 0,
        totalTypedChars: 0,
      },
    [finalMetrics, player],
  );

  const handleLevel2Progress = useCallback(
    (result: { level2Score: number; level2Correct: number; level2Progress: number }) => {
      void syncPlayer(result);
    },
    [syncPlayer],
  );

  const handleLevel2Finish = useCallback(
    (result: { level2Score: number; level2Correct: number; level2Progress: number }) => {
      setStep("level2Result");
      void syncPlayer({ ...result, status: "Finished" });
    },
    [syncPlayer],
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <BrandHeader />

        {step === "landing" ? (
          <Panel>
            <form onSubmit={handleJoin} className="mx-auto max-w-md">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
                Enter Your Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                maxLength={60}
              />
              {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
              <button className="mt-5 h-12 w-full rounded-lg bg-slate-950 px-5 font-bold text-white transition hover:bg-slate-800">
                Join Game
              </button>
            </form>
          </Panel>
        ) : null}

        {step === "instructions" ? (
          <Panel>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-950">How to Play</h2>
              <ul className="mt-5 space-y-3 text-left text-slate-700">
                <li>Type the paragraph as fast and accurately as possible.</li>
                <li>Timer starts after countdown.</li>
                <li>Mistakes reduce accuracy.</li>
                <li>No copy-paste allowed.</li>
                <li>Backspace is allowed.</li>
              </ul>
              <button
                onClick={handleReady}
                className="mt-6 h-12 rounded-lg bg-slate-950 px-8 font-bold text-white transition hover:bg-slate-800"
              >
                I&apos;m Ready
              </button>
            </div>
          </Panel>
        ) : null}

        {step === "waiting" ? (
          <Panel>
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
              <div className="absolute h-full w-full rounded-full border-4 border-slate-300" />
              <div className="absolute h-full w-full rounded-full border-4 border-slate-500 opacity-50 [animation:pulse-ring_1.4s_ease-out_infinite]" />
              <div className="h-4 w-4 rounded-full bg-slate-950" />
            </div>
            <p className="mt-6 text-lg font-semibold text-slate-700">
              Waiting for Admin to Start the Game...
            </p>
          </Panel>
        ) : null}

        {step === "countdown" ? (
          <Panel>
            <div key={countdownValue} className="countdown-pop text-8xl font-black text-slate-950">
              {Math.max(1, countdownValue)}
            </div>
          </Panel>
        ) : null}

        {step === "game" ? (
          <TypingRace
            roundEndsAt={snapshot?.roundEndsAt ?? null}
            onFinish={handleFinish}
            onProgress={handleProgress}
          />
        ) : null}

        {step === "result" ? (
          <Panel>
            <h2 className="text-2xl font-bold text-slate-950">Result</h2>
            <p className="mt-2 text-slate-600">{player?.name ?? name}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Result label="WPM" value={resultMetrics.wpm.toFixed(1)} />
              <Result label="Accuracy" value={`${resultMetrics.accuracy.toFixed(1)}%`} />
              <Result label="Final Score" value={resultMetrics.score.toFixed(1)} />
            </div>
          </Panel>
        ) : null}

        {step === "level2" ? (
          <IdentifyWordGame onProgress={handleLevel2Progress} onFinish={handleLevel2Finish} />
        ) : null}

        {step === "level2Result" ? (
          <Panel>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Level 2 Complete</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Identify the Word Result</h2>
            <p className="mt-2 text-slate-600">{player?.name ?? name}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Result label="Correct" value={`${player?.level2Correct ?? 0}/10`} />
              <Result label="Progress" value={`${player?.level2Progress ?? 0}%`} />
              <Result label="Level 2 Score" value={`${player?.level2Score ?? 0}`} />
            </div>
          </Panel>
        ) : null}

        {step === "notQualified" ? (
          <Panel>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Level 2</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Thanks for playing Level 1</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Level 2 is available only for the top 30% players from the typing race.
            </p>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      {children}
    </section>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}
