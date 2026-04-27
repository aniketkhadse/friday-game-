import { getSnapshot } from "@/store/game-store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(getSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
