import { GAME_SUBTITLE, GAME_TITLE } from "@/utils/game";

export function BrandHeader({ stage = "Level 1 Typing Race" }: { stage?: string }) {
  return (
    <header className="mb-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {stage}
      </p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950 sm:text-5xl">{GAME_TITLE}</h1>
      <p className="mt-3 text-base font-medium text-slate-600">{GAME_SUBTITLE}</p>
    </header>
  );
}
