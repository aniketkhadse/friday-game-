"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { IdentifyWordGame } from "@/components/IdentifyWordGame";
import { TypingRace } from "@/components/TypingRace";
import { useFairPlay } from "@/hooks/useFairPlay";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import {
  COUNTDOWN_SECONDS,
  isValidAristaUsername,
  getTopLevel2Players,
  normalizeEmailInput,
  sortLevel2Leaderboard,
  TypingMetrics,
} from "@/utils/game";

type PlayerStep =
  | "landing"
  | "instructions"
  | "waiting"
  | "countdown"
  | "game"
  | "result"
  | "level2Instructions"
  | "level2Countdown"
  | "level2"
  | "level2Result"
  | "notQualified";

export function PlayerApp() {
  const { snapshot, error: syncError } = useGameRealtime();
  const { player, setPlayer, join, syncPlayer, ready, clearPlayer } = useLocalPlayer();
  const [emailName, setEmailName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [step, setStep] = useState<PlayerStep>("landing");
  const [finalMetrics, setFinalMetrics] = useState<TypingMetrics | null>(null);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [level2CountdownValue, setLevel2CountdownValue] = useState(3);
  const [level2Ready, setLevel2Ready] = useState(false);
  const gameCanJoin = !snapshot || snapshot.gameState === "WAITING";

  useEffect(() => {
    if (!player?.id || !snapshot) return;
    const livePlayer = snapshot.players.find((candidate) => candidate.id === player.id);
    if (livePlayer) {
      setPlayer(livePlayer);
      return;
    }

    const timer = window.setTimeout(() => {
      clearPlayer();
      setStep("landing");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [clearPlayer, player?.id, player?.name, setPlayer, snapshot]);

  useEffect(() => {
    if (!player?.id || !snapshot) return;
    const livePlayer = snapshot.players.find((candidate) => candidate.id === player.id);
    if (!livePlayer) return;

    if (snapshot.gameState === "LEVEL2_RUNNING") {
      if (livePlayer.qualified && livePlayer.status !== "Finished") {
        if (!level2Ready && step !== "level2Instructions") {
          setStep("level2Instructions");
        }
        return;
      }

      if (livePlayer.qualified && livePlayer.status === "Finished") {
        setStep("level2Result");
        return;
      }

      setStep("notQualified");
      return;
    }

    if (snapshot.gameState === "ENDED") {
      setStep(livePlayer.qualified ? "level2Result" : "notQualified");
      return;
    }

    if (
      snapshot.gameState === "LEVEL1_RUNNING" &&
      snapshot.countdownEndsAt &&
      Date.now() < snapshot.countdownEndsAt
    ) {
      setStep("countdown");
      const secondsLeft = Math.max(1, Math.ceil((snapshot.countdownEndsAt - snapshot.serverNow) / 1000));
      setCountdownValue(secondsLeft);
      return;
    }

    if (snapshot.gameState === "LEVEL1_RUNNING" && livePlayer.status !== "Finished") {
      setStep("game");
      if (livePlayer.status !== "Playing") {
        void syncPlayer({ status: "Playing" });
      }
      return;
    }

    if (snapshot.gameState === "LEVEL1_DONE" || livePlayer.status === "Finished") {
      setStep("result");
    }
  }, [level2Ready, player?.id, snapshot, step, syncPlayer]);

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

  useEffect(() => {
    if (step !== "level2Countdown") return;

    setLevel2CountdownValue(3);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const secondsLeft = Math.max(0, 3 - Math.floor((Date.now() - startedAt) / 1000));
      setLevel2CountdownValue(secondsLeft);
      if (secondsLeft <= 0) {
        setStep("level2");
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [step]);

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = emailName.trim().toLowerCase();

    if (!gameCanJoin) {
      setError("Game already started. Please wait for next round.");
      return;
    }

    if (!isValidAristaUsername(cleanName)) {
      setError("Enter a valid Arista email username.");
      return;
    }

    setError("");
    setIsJoining(true);

    try {
      await join(normalizeEmailInput(cleanName));
      setStep("instructions");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to join game. Please try again.";
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleReady = async () => {
    await ready();
    setStep("waiting");
  };

  const handleFinish = useCallback(
    (metrics: TypingMetrics) => {
      setFinalMetrics(metrics);
      setStep("result");
      void syncPlayer({ ...metrics, level1Score: metrics.score, status: "Finished" });
    },
    [syncPlayer],
  );

  const handleProgress = useCallback(
    (_metrics: TypingMetrics) => undefined,
    [],
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

  const handleStartLevel2Local = useCallback(() => {
    setLevel2Ready(true);
    setStep("level2Countdown");
  }, []);

  const handleJoinAgain = useCallback(() => {
    clearPlayer();
    setFinalMetrics(null);
    setEmailName("");
    setError("");
    setStep("landing");
  }, [clearPlayer]);

  const selectedPlayers = useMemo(
    () => snapshot?.players.filter((candidate) => candidate.qualified) ?? [],
    [snapshot?.players],
  );
  const hasLevel1Selection = selectedPlayers.length > 0;
  const finalRank = useMemo(() => {
    if (!player?.id || !snapshot) return null;
    const ranked = sortLevel2Leaderboard(snapshot.players);
    const index = ranked.findIndex((candidate) => candidate.id === player.id);
    return index >= 0 ? index + 1 : null;
  }, [player?.id, snapshot]);
  const selectedForOfflineFinal = useMemo(() => {
    if (!player?.id || !snapshot || snapshot.gameState !== "ENDED") return false;
    return getTopLevel2Players(snapshot.players, snapshot.advancementPercent).some(
      (candidate) => candidate.id === player.id,
    );
  }, [player?.id, snapshot]);
  const stageLabel =
    step === "level2" || step === "level2Instructions" || step === "level2Countdown" || step === "level2Result"
      ? "Level 2 Guess the Word"
      : "Level 1 Typing Race";
  const fairPlayEnabled = ["countdown", "game", "level2Countdown", "level2"].includes(step);
  const handleTabSwitch = useCallback(() => {
    if (!player?.id) return;
    const nextCount = (player.tabSwitchCount ?? 0) + 1;
    void syncPlayer({
      tabSwitchCount: nextCount,
      suspiciousActivity: nextCount >= 2 || player.suspiciousActivity,
    });
  }, [player?.id, player?.suspiciousActivity, player?.tabSwitchCount, syncPlayer]);
  const { tabWarning, devToolsWarning } = useFairPlay({
    enabled: fairPlayEnabled,
    onTabSwitch: handleTabSwitch,
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <BrandHeader stage={stageLabel} />
        {syncError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {syncError}
          </div>
        ) : null}
        {fairPlayEnabled ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">
            Fair Play Enabled - Please stay on this screen
            {tabWarning ? (
              <span className="ml-2 text-amber-700">Stay on the game screen for fair play.</span>
            ) : null}
            {devToolsWarning ? (
              <span className="ml-2 text-slate-600">DevTools may be open.</span>
            ) : null}
          </div>
        ) : null}

        {step === "landing" ? (
          <Panel>
            <form onSubmit={handleJoin} className="mx-auto max-w-md">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
                Enter Arista Email
              </label>
              <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-200">
                <input
                  id="name"
                  value={emailName}
                  onChange={(event) => setEmailName(event.target.value)}
                  className="min-w-0 flex-1 px-4 text-slate-950 outline-none"
                  maxLength={48}
                  placeholder="aniket"
                  disabled={!gameCanJoin || isJoining}
                />
                <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                  @aristasystems.in
                </span>
              </div>
              {!gameCanJoin ? (
                <p className="mt-3 text-sm font-semibold text-amber-700">
                  Game already started. Please wait for next round.
                </p>
              ) : null}
              {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
              <button
                className="mt-5 h-12 w-full rounded-lg bg-slate-950 px-5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isJoining || !gameCanJoin}
                type="submit"
              >
                {isJoining ? "Joining..." : "Join Game"}
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
          <FullResult selected={player?.qualified ?? false} finalized={snapshot?.gameState === "LEVEL1_DONE"}>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Level 1 Result</p>
            <h2 className={`result-pop mt-5 text-5xl font-black sm:text-6xl ${player?.qualified ? "text-emerald-700" : "text-rose-700"}`}>
              {snapshot?.gameState === "LEVEL1_DONE"
                ? player?.qualified
                  ? "🎉 YOU ARE SELECTED FOR LEVEL 2 🎉"
                  : hasLevel1Selection
                    ? "❌ YOU ARE NOT SELECTED ❌"
                    : "RESULTS ARE BEING FINALIZED"
                : "LEVEL 1 COMPLETE"}
            </h2>
            {!player?.qualified && hasLevel1Selection ? (
              <p className="mt-4 text-2xl font-bold text-slate-600">Better luck next time</p>
            ) : null}
            <p className="mt-4 text-slate-600">{player?.email ?? player?.name ?? normalizeEmailInput(emailName)}</p>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
              <Result label="WPM" value={resultMetrics.wpm.toFixed(1)} />
              <Result label="Accuracy" value={`${resultMetrics.accuracy.toFixed(1)}%`} />
              <Result label="Final Score" value={resultMetrics.score.toFixed(1)} />
            </div>
            {!player?.qualified ? (
              <button
                onClick={handleJoinAgain}
                className="mt-8 h-11 rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Join as New Player
              </button>
            ) : null}
          </FullResult>
        ) : null}

        {step === "level2Instructions" ? (
          <Panel>
            <div className="screen-enter mx-auto max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Level 2</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Level 2 - Guess the Word</h2>
              <ul className="mt-6 space-y-3 text-left text-slate-700">
                <li>You will get 10 questions.</li>
                <li>Each question has 20 seconds.</li>
                <li>A hint and partial word will be shown.</li>
                <li>Type the correct word.</li>
                <li>Faster answers = higher score.</li>
                <li>If time ends, correct answer will be shown.</li>
              </ul>
              <button
                onClick={handleStartLevel2Local}
                className="mt-7 h-12 rounded-lg bg-indigo-600 px-8 font-bold text-white transition hover:bg-indigo-700"
              >
                Start Level 2
              </button>
            </div>
          </Panel>
        ) : null}

        {step === "level2Countdown" ? (
          <Panel>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Guess the Word begins in</p>
            <div key={level2CountdownValue} className="countdown-pop mt-4 text-8xl font-black text-indigo-700">
              {Math.max(1, level2CountdownValue)}
            </div>
          </Panel>
        ) : null}

        {step === "level2" ? (
          <IdentifyWordGame onProgress={handleLevel2Progress} onFinish={handleLevel2Finish} />
        ) : null}

        {step === "level2Result" ? (
          <FullResult selected={selectedForOfflineFinal}>
            <h2 className="result-pop text-5xl font-black text-slate-950 sm:text-6xl">🏆 FINAL RESULT 🏆</h2>
            <p className="mt-2 text-slate-600">{player?.email ?? player?.name ?? normalizeEmailInput(emailName)}</p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              <Result label="Rank" value={finalRank ? `#${finalRank}` : "-"} />
              <Result label="Level 2 Score" value={`${player?.level2Score ?? 0}`} />
            </div>
            {selectedForOfflineFinal ? (
              <p className="mt-8 text-4xl font-black text-emerald-700">
                🎉 YOU ARE SELECTED FOR LEVEL 3 OFFLINE 🎉
              </p>
            ) : snapshot?.gameState === "ENDED" ? (
              <p className="mt-8 text-3xl font-black text-rose-700">You are not selected for Level 3 offline</p>
            ) : null}
            {snapshot?.gameState === "ENDED" && !selectedForOfflineFinal ? (
              <button
                onClick={handleJoinAgain}
                className="mt-6 h-11 rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Join as New Player
              </button>
            ) : null}
          </FullResult>
        ) : null}

        {step === "notQualified" ? (
          <Panel>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Level 2</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Thanks for playing Level 1</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Level 2 is available only for the players selected by the admin after the typing race.
            </p>
            <button
              onClick={handleJoinAgain}
              className="mt-6 h-11 rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Join as New Player
            </button>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="screen-enter rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      {children}
    </section>
  );
}

function FullResult({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected: boolean;
  finalized?: boolean;
}) {
  return (
    <section
      className={`screen-enter flex min-h-[58vh] flex-col items-center justify-center rounded-lg border p-8 text-center shadow-sm ${
        selected ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
      }`}
    >
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
