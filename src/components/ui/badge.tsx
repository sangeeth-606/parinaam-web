import type * as React from "react";

import type { CaseStatus, ClassificationOutcome } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<CaseStatus, string> = {
  reported: "bg-slate-100 text-slate-700 border-slate-200",
  under_review: "bg-gold/30 text-[#7a5e0f] border-gold-deep/60",
  reviewed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  escalated: "bg-red-50 text-red-800 border-red-200",
};

const outcomeStyles: Record<ClassificationOutcome, string> = {
  positive: "bg-red-600 text-white border-red-700",
  negative: "bg-emerald-600 text-white border-emerald-700",
  inconclusive: "bg-amber-500 text-white border-amber-600",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status]
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function OutcomeBadge({ outcome }: { outcome: ClassificationOutcome }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        outcomeStyles[outcome]
      )}
    >
      {outcome}
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
