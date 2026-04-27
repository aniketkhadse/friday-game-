import { Player, sortLeaderboard } from "@/utils/game";

export function Leaderboard({
  players,
  topPercent,
}: {
  players: Player[];
  topPercent: number;
}) {
  const ranked = sortLeaderboard(players).filter((player) => player.score > 0);
  const topCount = Math.max(1, Math.ceil(ranked.length * (topPercent / 100)));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Player</th>
              <th className="px-5 py-3">WPM</th>
              <th className="px-5 py-3">Accuracy</th>
              <th className="px-5 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((player, index) => {
              const isTop = index < topCount;
              return (
                <tr key={player.id} className={isTop ? "bg-amber-50" : "bg-white"}>
                  <td className="px-5 py-3 font-bold text-slate-900">#{index + 1}</td>
                  <td className="px-5 py-3 text-slate-700">{player.name}</td>
                  <td className="px-5 py-3 text-slate-700">{player.wpm.toFixed(1)}</td>
                  <td className="px-5 py-3 text-slate-700">{player.accuracy.toFixed(1)}%</td>
                  <td className="px-5 py-3 font-bold text-slate-950">{player.score.toFixed(1)}</td>
                </tr>
              );
            })}
            {ranked.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={5}>
                  Scores will appear as players finish.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
