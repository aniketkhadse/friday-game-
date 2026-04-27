import { adminAction } from "@/store/game-store";

export const dynamic = "force-dynamic";

const actions = new Set(["start", "end", "reset", "startLevel2", "endLevel2"]);

export async function POST(request: Request) {
  const body = await request.json();
  const action = String(body.action ?? "");

  if (!actions.has(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  return Response.json(
    adminAction(action as "start" | "end" | "reset" | "startLevel2" | "endLevel2", {
      advancementPercent: typeof body.advancementPercent === "number" ? body.advancementPercent : undefined,
    }),
  );
}
