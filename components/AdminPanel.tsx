"use client";

import { useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { StatusPill } from "@/components/StatusPill";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import {
  endLevel1,
  endLevel2,
  resetGame,
  selectLevel2Players,
  startLevel1,
  startLevel2,
  type AdvancementMode,
} from "@/store/firestore-game";
import {
  getPlayerStatusCounts,
  getTopLevel1Players,
  getTopLevel1PlayersByCount,
  GameState,
  Player,
  sortLevel2Leaderboard,
} from "@/utils/game";

export function AdminPanel() {
  const { snapshot, isLoading, error } = useGameRealtime();
  const [selectionMode, setSelectionMode] = useState<AdvancementMode>("percent");
  const [selectionValue, setSelectionValue] = useState(30);
  const [isActing, setIsActing] = useState(false);
  const players = snapshot?.players ?? [];
  const gameState = snapshot?.gameState ?? "WAITING";

  const counts = useMemo(() => getPlayerStatusCounts(players), [players]);
  const selectedForLevel2 = useMemo(() => {
    const persisted = players.filter((player) => player.qualified);
    if (persisted.length > 0) {
      return persisted.sort((a, b) => (b.level1Score || b.score) - (a.level1Score || a.score));
    }

    return selectionMode === "count"
      ? getTopLevel1PlayersByCount(players, selectionValue)
      : getTopLevel1Players(players, selectionValue);
  }, [players, selectionMode, selectionValue]);
  const finalWinners = useMemo(() => sortLevel2Leaderboard(players), [players]);

  async function runAction(action: () => Promise<void>) {
    setIsActing(true);
    try {
      await action();
    } finally {
      setIsActing(false);
    }
  }

  async function handleStartLevel2() {
    await selectLevel2Players({ mode: selectionMode, value: selectionValue });
    await startLevel2();
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <BrandHeader />

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Game State</div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                {isLoading ? "SYNCING" : formatState(gameState)}
              </div>
              {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
            </div>
            <StateAction
              gameState={gameState}
              isActing={isActing}
              selectionMode={selectionMode}
              selectionValue={selectionValue}
              onSelectionMode={setSelectionMode}
              onSelectionValue={setSelectionValue}
              onStartLevel1={() => void runAction(startLevel1)}
              onEndLevel1={() => void runAction(endLevel1)}
              onStartLevel2={() => void runAction(handleStartLevel2)}
              onEndLevel2={() => void runAction(endLevel2)}
              onReset={() => void runAction(resetGame)}
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total Players Joined" value={counts.total} />
          <Stat label="Players Ready" value={counts.ready} />
          <Stat label="Players Playing" value={counts.playing} />
          <Stat label="Players Finished" value={counts.finished} />
        </section>

        {gameState === "ENDED" ? (
          <FinalWinners players={finalWinners} />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <PlayerMonitor players={players} />
            <section className="space-y-4">
              <Leaderboard players={players} topPercent={selectionMode === "percent" ? selectionValue : 30} />
              {(gameState === "LEVEL1_DONE" || gameState === "LEVEL2_RUNNING") ? (
                <SelectedPlayers players={selectedForLevel2} />
              ) : null}
              {gameState === "LEVEL2_RUNNING" ? <Level2Leaderboard players={players} /> : null}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function StateAction({
  gameState,
  isActing,
  selectionMode,
  selectionValue,
  onSelectionMode,
  onSelectionValue,
  onStartLevel1,
  onEndLevel1,
  onStartLevel2,
  onEndLevel2,
  onReset,
}: {
  gameState: GameState;
  isActing: boolean;
  selectionMode: AdvancementMode;
  selectionValue: number;
  onSelectionMode: (mode: AdvancementMode) => void;
  onSelectionValue: (value: number) => void;
  onStartLevel1: () => void;
  onEndLevel1: () => void;
  onStartLevel2: () => void;
  onEndLevel2: () => void;
  onReset: () => void;
}) {
  if (gameState === "WAITING") {
    return <MainButton label="Start Level 1" disabled={isActing} onClick={onStartLevel1} tone="green" />;
  }

  if (gameState === "LEVEL1_RUNNING") {
    return <MainButton label="End Level 1" disabled={isActing} onClick={onEndLevel1} tone="dark" />;
  }

  if (gameState === "LEVEL1_DONE") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="text-sm font-bold text-slate-800" htmlFor="selectionMode">
            Select Players By
          </label>
          <select
            id="selectionMode"
            value={selectionMode}
            onChange={(event) => onSelectionMode(event.target.value as AdvancementMode)}
            className="mt-2 h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
          >
            <option value="percent">Percentage</option>
            <option value="count">Number</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-800" htmlFor="selectionValue">
            {selectionMode === "percent" ? "Advance %" : "Advance Count"}
          </label>
          {selectionMode === "percent" ? (
            <select
              id="selectionValue"
              value={selectionValue}
              onChange={(event) => onSelectionValue(Number(event.target.value))}
              className="mt-2 h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            >
              <option value={30}>30%</option>
              <option value={50}>50%</option>
              <option value={100}>100%</option>
            </select>
          ) : (
            <input
              id="selectionValue"
              type="number"
              min={0}
              value={selectionValue}
              onChange={(event) => onSelectionValue(Number(event.target.value))}
              className="mt-2 h-11 w-32 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            />
          )}
        </div>
        <MainButton label="Start Level 2" disabled={isActing} onClick={onStartLevel2} tone="indigo" />
      </div>
    );
  }

  if (gameState === "LEVEL2_RUNNING") {
    return <MainButton label="End Level 2" disabled={isActing} onClick={onEndLevel2} tone="red" />;
  }

  return <MainButton label="Reset Game" disabled={isActing} onClick={onReset} tone="dark" />;
}

function MainButton({
  label,
  disabled,
  onClick,
  tone,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  tone: "green" | "dark" | "indigo" | "red";
}) {
  const toneClass = {
    green: "bg-emerald-600 hover:bg-emerald-700",
    dark: "bg-slate-950 hover:bg-slate-800",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    red: "bg-rose-600 hover:bg-rose-700",
  }[tone];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-12 rounded-lg px-6 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {label}
    </button>
  );
}

function PlayerMonitor({ players }: { players: Player[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Live Player Monitoring</h2>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Player</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Qualified</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">L1 Score</th>
              <th className="px-5 py-3">L2 Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player) => (
              <tr key={player.id}>
                <td className="px-5 py-3 font-semibold text-slate-800">{player.name}</td>
                <td className="px-5 py-3">
                  <StatusPill status={player.status} />
                </td>
                <td className="px-5 py-3 font-bold text-slate-700">{player.qualified ? "Yes" : "No"}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-800" style={{ width: `${player.progress}%` }} />
                    </div>
                    <span className="w-10 text-slate-600">{player.progress.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-bold text-slate-900">
                  {(player.level1Score || player.score).toFixed(1)}
                </td>
                <td className="px-5 py-3 font-bold text-slate-900">{player.level2Score.toFixed(0)}</td>
              </tr>
            ))}
            {players.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                  Waiting for players to join.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelectedPlayers({ players }: { players: Player[] }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Selected for Level 2 🎉</h2>
      <div className="mt-4 space-y-2">
        {players.map((player, index) => (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3" key={player.id}>
            <span className="w-12 font-black text-emerald-800">#{index + 1}</span>
            <span className="font-bold text-slate-900">{player.name}</span>
          </div>
        ))}
        {players.length === 0 ? <p className="text-sm text-slate-500">No players selected yet.</p> : null}
      </div>
    </section>
  );
}

function Level2Leaderboard({ players }: { players: Player[] }) {
  const ranked = sortLevel2Leaderboard(players);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Level 2 Leaderboard</h2>
      </div>
      <LeaderboardTable players={ranked} scoreKey="level2" empty="Level 2 scores will appear during the round." />
    </section>
  );
}

function FinalWinners({ players }: { players: Player[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-2xl font-black text-slate-950">Final Winners 🏆</h2>
        <p className="mt-1 text-slate-600">These winners will proceed to offline final round</p>
      </div>
      <LeaderboardTable players={players} scoreKey="level2" empty="No Level 2 scores yet." />
    </section>
  );
}

function LeaderboardTable({
  players,
  scoreKey,
  empty,
}: {
  players: Player[];
  scoreKey: "level1" | "level2";
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {players.map((player, index) => (
            <tr key={player.id}>
              <td className="px-5 py-3 font-bold text-slate-900">#{index + 1}</td>
              <td className="px-5 py-3 font-semibold text-slate-800">{player.name}</td>
              <td className="px-5 py-3 font-black text-slate-950">
                {(scoreKey === "level1" ? player.level1Score || player.score : player.level2Score).toFixed(0)}
              </td>
            </tr>
          ))}
          {players.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={3}>
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-4xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function formatState(state: GameState) {
  return state.replaceAll("_", " ");
}
