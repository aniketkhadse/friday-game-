"use client";

import { useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { StatusPill } from "@/components/StatusPill";
import { useGamePolling } from "@/hooks/useGamePolling";
import {
  getPlayerStatusCounts,
  getTopLevel2Players,
  getTopLevel1Players,
  GameSnapshot,
  Player,
  sortLevel2Leaderboard,
} from "@/utils/game";

export function AdminPanel() {
  const { snapshot, isLoading, error, setSnapshot } = useGamePolling(750);
  const [advancementPercent, setAdvancementPercent] = useState(30);
  const [isActing, setIsActing] = useState(false);

  const counts = useMemo(
    () => getPlayerStatusCounts(snapshot?.players ?? []),
    [snapshot?.players],
  );

  const level2Eligible = useMemo(
    () => {
      const players = snapshot?.players ?? [];
      const persisted = players.filter((player) => player.level2Eligible);
      return persisted.length > 0 ? persisted : getTopLevel1Players(players, advancementPercent);
    },
    [advancementPercent, snapshot?.players],
  );

  const level3Eligible = useMemo(
    () => getTopLevel2Players(snapshot?.players ?? [], advancementPercent),
    [advancementPercent, snapshot?.players],
  );

  async function runAction(action: "start" | "end" | "reset" | "startLevel2" | "endLevel2") {
    setIsActing(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, advancementPercent }),
      });

      if (response.ok) {
        const data = (await response.json()) as GameSnapshot;
        setSnapshot(data);
      }
    } finally {
      setIsActing(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <BrandHeader />

        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Global State</div>
            <div className="mt-1 text-2xl font-black text-slate-950">
              {snapshot?.gameState ?? (isLoading ? "SYNCING" : "WAITING")}
            </div>
            {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void runAction("start")}
              disabled={isActing}
              className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Level 1
            </button>
            <button
              onClick={() => void runAction("end")}
              disabled={isActing}
              className="h-11 rounded-lg bg-slate-900 px-5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              End Level 1
            </button>
            <button
              onClick={() => void runAction("startLevel2")}
              disabled={isActing}
              className="h-11 rounded-lg bg-indigo-600 px-5 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Level 2
            </button>
            <button
              onClick={() => void runAction("endLevel2")}
              disabled={isActing}
              className="h-11 rounded-lg bg-rose-600 px-5 font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              End Level 2
            </button>
            <button
              onClick={() => void runAction("reset")}
              disabled={isActing}
              className="h-11 rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset Game
            </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total Players Joined" value={counts.total} />
          <Stat label="Players Ready" value={counts.ready} />
          <Stat label="Players Playing" value={counts.playing} />
          <Stat label="Players Finished" value={counts.finished} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">Live Player Monitoring</h2>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Player</th>
                    <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Progress</th>
                      <th className="px-5 py-3">L1 Score</th>
                      <th className="px-5 py-3">L2 Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(snapshot?.players ?? []).map((player) => (
                    <tr key={player.id}>
                      <td className="px-5 py-3 font-semibold text-slate-800">{player.name}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={player.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-slate-800" style={{ width: `${player.progress}%` }} />
                          </div>
                          <span className="w-10 text-slate-600">{player.progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900">{player.score.toFixed(1)}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{player.level2Score.toFixed(0)}</td>
                    </tr>
                  ))}
                  {snapshot?.players.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-500" colSpan={5}>
                        Waiting for players to join.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-bold text-slate-800" htmlFor="advancementPercent">
                Players Advancing
              </label>
              <select
                id="advancementPercent"
                value={advancementPercent}
                onChange={(event) => setAdvancementPercent(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value={30}>30%</option>
                <option value={50}>50%</option>
                <option value={100}>100%</option>
              </select>
              <p className="mt-2 text-sm text-slate-500">
                This percentage is used when starting the next level.
              </p>
            </div>
            <Leaderboard players={snapshot?.players ?? []} topPercent={advancementPercent} />
            <EligibleList
              players={level2Eligible}
              percent={snapshot?.advancementPercent ?? advancementPercent}
              title="Selected for Level 2"
              subtitle="From Level 1 leaderboard"
              emptyText="Finish Level 1 to select players."
            />
            <Level2Leaderboard players={snapshot?.players ?? []} topPercent={advancementPercent} />
            <EligibleList
              players={level3Eligible}
              percent={advancementPercent}
              title="Selected for Level 3"
              subtitle="From Level 2 leaderboard"
              emptyText="Finish Level 2 to select players for the next level."
              color="indigo"
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function EligibleList({
  players,
  percent,
  title,
  subtitle,
  emptyText,
  color = "emerald",
}: {
  players: Player[];
  percent: number;
  title: string;
  subtitle: string;
  emptyText: string;
  color?: "emerald" | "indigo";
}) {
  const pillClass =
    color === "indigo"
      ? "rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800"
      : "rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Top {percent}% {subtitle}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {players.map((player, index) => (
          <span className={pillClass} key={player.id}>
            #{index + 1} {player.name}
          </span>
        ))}
        {players.length === 0 ? <p className="text-sm text-slate-500">{emptyText}</p> : null}
      </div>
    </div>
  );
}

function Level2Leaderboard({ players, topPercent }: { players: Player[]; topPercent: number }) {
  const ranked = sortLevel2Leaderboard(players);
  const topCount = Math.max(1, Math.ceil(ranked.length * (topPercent / 100)));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Level 2 Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Player</th>
              <th className="px-5 py-3">Correct</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((player, index) => (
              <tr key={player.id} className={index < topCount ? "bg-indigo-50" : "bg-white"}>
                <td className="px-5 py-3 font-bold text-slate-900">#{index + 1}</td>
                <td className="px-5 py-3 text-slate-700">{player.name}</td>
                <td className="px-5 py-3 text-slate-700">{player.level2Correct}/10</td>
                <td className="px-5 py-3 text-slate-700">{player.level2Progress.toFixed(0)}%</td>
                <td className="px-5 py-3 font-bold text-slate-950">{player.level2Score.toFixed(0)}</td>
              </tr>
            ))}
            {ranked.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={5}>
                  Level 2 scores will appear after the round starts.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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
