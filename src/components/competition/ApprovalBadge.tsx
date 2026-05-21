import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function ApprovalBadge({ status, notes, size = "sm" }: { status: string; notes?: string | null; size?: "sm" | "md" }) {
  const isMd = size === "md";
  const base = `inline-flex items-center gap-1 rounded-full font-semibold ${isMd ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`;
  if (status === "approved") {
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/40`}>
        <CheckCircle2 className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className={`${base} bg-rose-500/15 text-rose-400 border border-rose-500/40`} title={notes || undefined}>
        <XCircle className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} /> Rejected
      </span>
    );
  }
  return (
    <span className={`${base} bg-amber-500/15 text-amber-400 border border-amber-500/40`}>
      <Clock className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} /> Pending review
    </span>
  );
}
