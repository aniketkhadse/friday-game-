import { PlayerStatus } from "@/utils/game";

const styles: Record<PlayerStatus, string> = {
  Waiting: "bg-slate-100 text-slate-700",
  Ready: "bg-amber-100 text-amber-800",
  Playing: "bg-emerald-100 text-emerald-800",
  Finished: "bg-indigo-100 text-indigo-800",
};

export function StatusPill({ status }: { status: PlayerStatus }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
