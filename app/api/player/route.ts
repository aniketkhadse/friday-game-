import { updatePlayer, upsertPlayer } from "@/store/game-store";
import { PlayerStatus } from "@/utils/game";

export const dynamic = "force-dynamic";

const statuses = new Set<PlayerStatus>(["Waiting", "Ready", "Playing", "Finished"]);

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const id = typeof body.id === "string" ? body.id : undefined;
  const status = statuses.has(body.status) ? body.status : undefined;

  if (!id && !name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (id) {
    const player = updatePlayer({
      id,
      status,
      progress: finiteNumber(body.progress),
      wpm: finiteNumber(body.wpm),
      accuracy: finiteNumber(body.accuracy),
      score: finiteNumber(body.score),
      level2Progress: finiteNumber(body.level2Progress),
      level2Score: finiteNumber(body.level2Score),
      level2Correct: finiteNumber(body.level2Correct),
    });

    if (player) return Response.json({ player });
  }

  const player = upsertPlayer({
    id,
    name,
    status,
    progress: finiteNumber(body.progress),
    wpm: finiteNumber(body.wpm),
    accuracy: finiteNumber(body.accuracy),
    score: finiteNumber(body.score),
  });

  return Response.json({ player });
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
