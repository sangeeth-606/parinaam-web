import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export function PresumptiveBanner({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-900 ${className}`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
        <span className="font-semibold">PRESUMPTIVE INDICATOR ONLY:</span>
        <span className="text-amber-800">
          Field assays require confirmatory laboratory analysis under Rule 10(2) NDPS Rules, 2022.
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 shadow-xs text-amber-950 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1 text-xs sm:text-sm">
          <p className="font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
            Presumptive Field Indicator Notice
            <span className="inline-flex items-center gap-1 rounded bg-amber-200/80 px-1.5 py-0.2 text-[11px] font-semibold text-amber-900">
              <ShieldCheck className="h-3 w-3" /> Rule 10(2) NDPS Rules, 2022 · BSA §63
            </span>
          </p>
          <p className="mt-1 text-amber-800 leading-relaxed">
            All colourimetric field test evaluations displayed here are <strong>presumptive screening indicators</strong>,
            not definitive chemical identities. These assays establish reasonable cause for lawful seizure; definitive qualitative
            and quantitative confirmation requires accredited government laboratory chemical analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
