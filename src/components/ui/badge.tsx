import type * as React from "react";

import type { CaseStatus, ClassificationOutcome } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  reported: "bg-slate-100 text-slate-700 border-slate-200",
  under_review: "bg-amber-50 text-amber-800 border-amber-300",
  reviewed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  escalated: "bg-red-50 text-red-800 border-red-200",
  REPORTED: "bg-slate-100 text-slate-700 border-slate-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-300",
  REVIEWED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ESCALATED: "bg-red-50 text-red-800 border-red-200",
};

const outcomeStyles: Record<string, string> = {
  CONSISTENT_WITH_REAGENT_POSITIVE: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
  CONSISTENT_WITH_REAGENT_NEGATIVE: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
  INCONCLUSIVE: "bg-slate-100 text-slate-800 border-slate-300 font-bold",
  positive: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
  negative: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
  inconclusive: "bg-slate-100 text-slate-800 border-slate-300 font-bold",
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

export function OutcomeBadge({ outcome }: { outcome: ClassificationOutcome | string }) {
  const raw = outcome || "INCONCLUSIVE";
  let label = raw;
  if (raw === "CONSISTENT_WITH_REAGENT_POSITIVE" || raw === "positive") {
    label = "REAGENT POSITIVE (PRESUMPTIVE)";
  } else if (raw === "CONSISTENT_WITH_REAGENT_NEGATIVE" || raw === "negative") {
    label = "REAGENT NEGATIVE (PRESUMPTIVE)";
  } else if (raw === "INCONCLUSIVE" || raw === "inconclusive") {
    label = "INCONCLUSIVE";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs tracking-wide",
        outcomeStyles[raw] || "bg-slate-100 text-slate-800 border-slate-300"
      )}
    >
      {label}
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
        "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
