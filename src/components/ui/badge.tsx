import { CheckCircle2, AlertTriangle, Lock, Link2, Wifi, WifiOff } from "lucide-react";

import type { CaseStatus, ClassificationOutcome } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  reported: "bg-slate-100 text-slate-700 border-slate-200",
  under_review: "bg-amber-50 text-amber-800 border-amber-300",
  reviewed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  escalated: "bg-red-50 text-red-800 border-red-300",
  REPORTED: "bg-slate-100 text-slate-700 border-slate-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-300",
  REVIEWED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ESCALATED: "bg-red-50 text-red-800 border-red-300",
};

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const norm = (status || "reported").toLowerCase();
  const display = norm.replace("_", " ").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        statusStyles[status] || statusStyles[norm] || "bg-slate-100 text-slate-700 border-slate-200"
      )}
    >
      {display}
    </span>
  );
}

export function OutcomeBadge({
  outcome,
  showIcon = true,
  className = "",
}: {
  outcome: ClassificationOutcome | string;
  showIcon?: boolean;
  className?: string;
}) {
  const raw = outcome || "INCONCLUSIVE";
  const isPos = raw === "CONSISTENT_WITH_REAGENT_POSITIVE" || raw === "positive";
  const isNeg = raw === "CONSISTENT_WITH_REAGENT_NEGATIVE" || raw === "negative";

  let label = "INCONCLUSIVE";
  let style = "bg-amber-50 text-amber-900 border-amber-300";
  let Icon = AlertTriangle;

  if (isPos) {
    label = "CONSISTENT WITH POSITIVE";
    style = "bg-emerald-50 text-emerald-900 border-emerald-300";
    Icon = CheckCircle2;
  } else if (isNeg) {
    label = "CONSISTENT WITH NEGATIVE";
    style = "bg-slate-100 text-slate-800 border-slate-300";
    Icon = CheckCircle2;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase",
        style,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

export function IntegrityBadge({
  deviceAttestation,
  className = "",
}: {
  deviceAttestation?: string | null;
  className?: string;
}) {
  const isSealed = Boolean(deviceAttestation);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        isSealed
          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
          : "bg-amber-50 text-amber-800 border-amber-300",
        className
      )}
    >
      {isSealed ? (
        <>
          <Lock className="h-3 w-3 text-emerald-700" />
          <span>INTEGRITY SEALED</span>
        </>
      ) : (
        <>
          <Link2 className="h-3 w-3 text-amber-700" />
          <span>CHAIN-ONLY</span>
        </>
      )}
    </span>
  );
}

export function SyncBadge({
  synced = true,
  seq,
  className = "",
}: {
  synced?: boolean;
  seq?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        synced
          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
          : "bg-amber-50 text-amber-800 border-amber-300",
        className
      )}
    >
      {synced ? (
        <>
          <Wifi className="h-3 w-3 text-emerald-700" />
          <span>SYNCED TO SERVER</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-amber-700" />
          <span>LOCAL QUEUE {seq ? `#${String(seq).padStart(2, "0")}` : ""}</span>
        </>
      )}
    </span>
  );
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700",
        className
      )}
      {...props}
    />
  );
}
