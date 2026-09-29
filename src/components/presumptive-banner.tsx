import React from "react";
import { AlertTriangle, ShieldCheck, Scale } from "lucide-react";

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
        className={`flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs text-amber-900 shadow-2xs ${className}`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
        <span className="font-bold tracking-wide uppercase">PRESUMPTIVE INDICATOR ONLY:</span>
        <span className="text-amber-800">
          Field tests are presumptive indicators, never confirmatory laboratory assays. Mandatory forensic laboratory confirmation required under Rule 10(2) of NDPS Rules, 2022.
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-amber-50/90 to-amber-50/40 border-l-4 border-amber-600 border-y border-r border-amber-200/80 p-4 shadow-2xs text-amber-950 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-1.5 mt-0.5">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
        </div>
        <div className="flex-1 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-amber-950 uppercase tracking-wide">
              Presumptive Field Assay Notice
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" /> Rule 10(2) NDPS Rules, 2022 · BSA §63
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-800 leading-relaxed font-normal">
            All colourimetric field test evaluations displayed here are <strong>presumptive screening indicators</strong>,
            never substantive chemical identities. They establish reasonable grounds for lawful seizure and inventory;
            definitive qualitative and quantitative confirmation requires accredited government laboratory chemical analysis prior to judicial filing.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatutoryFootnote({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-blue-50/60 border border-blue-200/70 p-4 text-center text-xs text-blue-900 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider text-blue-900 mb-1">
        <Scale className="h-4 w-4 text-blue-700" />
        <span>Statutory Footnote &amp; Evidentiary Basis</span>
      </div>
      <p className="text-[11px] text-blue-800 leading-relaxed uppercase tracking-wide">
        Rule 10(2) of the NDPS (Seizure, Storage, Sampling and Disposal) Rules, 2022 • Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Compliant
      </p>
      <p className="text-[10.5px] text-blue-700/80 mt-0.5">
        Presumptive field test result only. Mandatory forensic laboratory confirmation required prior to judicial filing under Section 52A NDPS Act &amp; Section 63 BSA 2023.
      </p>
    </div>
  );
}
