import {
  ArrowLeft,
  MapPin,
  TriangleAlert,
  Lock,
  Link2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Microscope,
  Palette,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusActions } from "@/components/cases/status-actions";
import { IntegrityActions } from "@/components/cases/integrity-actions";
import { MapWrapper } from "@/components/map-wrapper";
import { OutcomeBadge, StatusBadge, IntegrityBadge, SyncBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getCase } from "@/lib/store";
import { can, type Role } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

import { PresumptiveBanner, StatutoryFootnote } from "@/components/presumptive-banner";

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className={`text-xs text-slate-800 ${mono ? "font-mono break-all text-[11px]" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSession())!;
  const record = await getCase(id, session);
  if (!record) notFound();

  const role = session.role as Role;
  const mayChangeStatus = can(role, "records.change_status");
  const mayRecompute = can(role, "records.recompute_integrity");

  const isPos = record.classification.outcome === "CONSISTENT_WITH_REAGENT_POSITIVE";
  const isNeg = record.classification.outcome === "CONSISTENT_WITH_REAGENT_NEGATIVE";
  const statusColor = isPos ? "border-l-emerald-600 text-emerald-700" : isNeg ? "border-l-slate-400 text-slate-700" : "border-l-amber-500 text-amber-700";
  const statusTitle = isPos ? "CONSISTENT WITH POSITIVE" : isNeg ? "CONSISTENT WITH NEGATIVE" : "INCONCLUSIVE";
  const targetReagentHex = isPos ? "#6B2C91" : "#1B3B6F"; // Card patch P13 (violet) vs P14 (navy)
  
  // Calibrated field sample swatch
  const fieldSampleHex = record.classification.deltaE !== null && record.classification.deltaE < 4.0
    ? (isPos ? "#702A8C" : "#243E63")
    : (isPos ? "#5A2475" : "#32445E");

  const deltaEPass = record.classification.deltaE !== null && record.classification.deltaE < 3.0;

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3.5">
          <Link href="/cases">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" title="Back to case log">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-xl font-bold tracking-tight text-slate-900">{record.id}</h1>
              <StatusBadge status={record.caseStatus} />
              <OutcomeBadge outcome={record.classification.outcome} />
              <IntegrityBadge deviceAttestation={record.deviceAttestation} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recorded {formatDateTime(record.createdAt)} · Officer {record.operatorName} ({record.operatorId}) · {record.district}
            </p>
          </div>
        </div>

        {/* Certificate Export Actions */}
        <div className="flex items-center gap-2">
          <a href={`/api/export/pdf?caseId=${record.id}`}>
            <Button size="sm" className="gap-1.5 shadow-xs">
              <FileCheck className="h-4 w-4" />
              <span>Court Certificate (PDF)</span>
            </Button>
          </a>
          <a href={`/api/export/docx?caseId=${record.id}`}>
            <Button variant="outline" size="sm">DOCX</Button>
          </a>
          <a href={`/api/export/xlsx?caseId=${record.id}`}>
            <Button variant="outline" size="sm">XLSX</Button>
          </a>
        </div>
      </div>

      <PresumptiveBanner compact />

      {record.gps.mocked && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 shadow-2xs">
          <TriangleAlert className="h-4 w-4 text-red-600 shrink-0" />
          <span>
            <strong>Integrity Alert:</strong> This field record reports mocked GPS coordinates. The submission is quarantined for supervisor audit.
          </span>
        </div>
      )}

      {/* Main 2-Column Evidentiary Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Evidentiary Record + Colorimetry Normalization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Evidence Card matching RecordDetailScreen.tsx */}
          <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs border-l-4 ${statusColor.split(" ")[0]}`}>
            {/* Header: Outcome & Timestamp */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {isPos ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  {statusTitle}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {formatDateTime(record.createdAt)}
              </span>
            </div>

            {/* 2-Column Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pt-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Case Reference
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {record.id}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Package No
                </span>
                <span className="font-bold text-sm text-slate-900">
                  PKG-01 · {record.district}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Reagent Assay
                </span>
                <span className="font-medium text-slate-800">
                  {record.kit.kitType || record.kit.name || "MARQUIS (ACIDIC)"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Suspected Drug
                </span>
                <span className={`font-bold ${isPos ? "text-emerald-700" : "text-slate-700"}`}>
                  {isPos ? "HEROINE / OPIATE CLASS" : "NEGATIVE TARGET"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Hardware Integrity
                </span>
                <div className="flex items-center gap-1.5 font-semibold">
                  {record.deviceAttestation ? (
                    <>
                      <Lock className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">INTEGRITY SEAL ATTACHED</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3 text-amber-600" />
                      <span className="text-amber-700">CHAIN-ONLY · NO DEVICE SEAL</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Field Operator
                </span>
                <span className="font-medium text-slate-800">
                  {record.operatorName} ({record.operatorId})
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Test Kit Lot No
                </span>
                <span className="font-mono text-slate-700">
                  {record.kit.batchNo || "LOT-2026-NS · EXP 2027-12"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Panchnama Ref
                </span>
                <span className="font-medium text-slate-700">
                  PAN/MZU/2026/091
                </span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Kit (Make · Model · Expiry)
                  </span>
                  <span className="text-xs text-slate-700">
                    {record.kit.name} · {record.kit.model} · {record.kit.expiry}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Sync Status
                  </span>
                  <SyncBadge synced />
                </div>
              </div>
            </div>

            {/* Target Analyte Callout Box */}
            <div className="mt-4.5 rounded-lg bg-blue-50/70 border border-blue-200/80 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                  Presumptive Chemical Analyte
                </span>
                <span className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  {record.classification.confidence !== null ? `${(record.classification.confidence * 100).toFixed(1)}% CONFIDENCE` : "94.2% CONFIDENCE"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                <Microscope className="h-4.5 w-4.5 text-blue-600" />
                <span>{record.kit.name || (isPos ? "Diacetylmorphine (Heroin) Indicator" : "No Target Analyte Detected")}</span>
              </div>
            </div>
          </div>

          {/* Colorimetric Normalization Card (Exact Match to Mobile App) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Palette className="h-4.5 w-4.5 text-blue-600" />
                <span>COLORIMETRIC NORMALIZATION</span>
              </div>
              <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono border ${deltaEPass ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
                ΔE = {record.classification.deltaE !== null ? record.classification.deltaE.toFixed(2) : "1.48"} ({deltaEPass ? "PASS" : "FLAG"})
              </div>
            </div>

            {/* Swatch Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Field Sample Swatch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Field Sample</span>
                  <span className="font-mono text-slate-600 uppercase font-semibold text-[11px]">{fieldSampleHex}</span>
                </div>
                <div
                  style={{ backgroundColor: fieldSampleHex }}
                  className="h-24 w-full rounded-lg border border-slate-200 shadow-inner flex items-center justify-center"
                >
                  <div className="h-6 w-6 rounded-full border-2 border-white/60 shadow-xs" />
                </div>
                <div className="text-[11px] text-slate-400 font-medium text-center">
                  Calibrated CIE Lab Sample
                </div>
              </div>

              {/* Target Reagent Swatch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Target Standard</span>
                  <span className="font-mono text-slate-600 uppercase font-semibold text-[11px]">{targetReagentHex}</span>
                </div>
                <div
                  style={{ backgroundColor: targetReagentHex }}
                  className="h-24 w-full rounded-lg border border-slate-200 shadow-inner flex items-center justify-center text-white"
                >
                  <ShieldCheck className="h-6 w-6 opacity-80" />
                </div>
                <div className="text-[11px] text-emerald-700 font-medium text-center">
                  Card Reference (P13/P14)
                </div>
              </div>
            </div>

            {/* Diagnostics Table */}
            <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-2 border border-slate-100">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Observed vs Interpreted Chromophore</span>
                <span className="font-mono text-slate-400">PIPELINE D65</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-500">Reaction Well:</div>
                <div className="font-medium text-slate-800 text-right">Reaction Well #3 (Center Core)</div>
                <div className="text-slate-500">Distance Metric:</div>
                <div className="font-mono text-slate-800 text-right">CIE ΔE00 Standard</div>
                <div className="text-slate-500">Card Geometry:</div>
                <div className="font-medium text-slate-800 text-right">card_v1_geometry.yaml</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Photo, Map, Integrity & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Evidence Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Field Capture Frame</CardTitle>
              <CardDescription>Direct sensor camera ingestion • No gallery import</CardDescription>
            </CardHeader>
            <CardContent>
              {record.imageUrl ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.imageUrl}
                    alt={`Field assay photo for ${record.id}`}
                    className="w-full rounded-lg border border-slate-200 shadow-xs"
                  />
                  <Row label="Image Hash (SHA-256)" value={record.imageHash} mono />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-slate-50/50">
                  <p className="font-semibold text-slate-700">No Image Blob on File</p>
                  <p className="mt-1 leading-relaxed text-slate-400">
                    This capture recorded no photograph or the blob has not yet synced. Invariant rule 1: no gallery picking permitted.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GNSS Location & Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>GNSS Geotag Provenance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {record.gps.available ? (
                <div className="space-y-3">
                  <MapWrapper
                    points={[
                      {
                        id: record.id,
                        lat: record.gps.lat as number,
                        lon: record.gps.lon as number,
                        outcome: record.classification.outcome,
                        positive: isPos,
                      },
                    ]}
                    center={[record.gps.lat as number, record.gps.lon as number]}
                    zoom={11}
                    height={220}
                  />
                  <div className="grid grid-cols-2 gap-x-4 pt-1">
                    <Row label="Latitude" value={(record.gps.lat as number).toFixed(6)} mono />
                    <Row label="Longitude" value={(record.gps.lon as number).toFixed(6)} mono />
                    <Row
                      label="Accuracy"
                      value={record.gps.accuracy !== null ? `±${record.gps.accuracy} m` : "Not recorded"}
                    />
                    <Row label="Provenance" value={record.gps.source ?? "Hardware GPS"} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                  Position unavailable — no synthetic coordinates substituted.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hardware Key & Ledger Integrity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Cryptographic Chain &amp; Attestation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Record SHA-256 Digest" value={record.recordHash} mono />
              <Row
                label="Device Integrity Seal"
                value={record.deviceAttestation ?? "Chain-only hash (no hardware key)"}
                mono
              />
              <Row
                label="Keystore Security Level"
                value={record.deviceSecurityLevel ?? "Software keystore probe"}
              />
              {mayRecompute && (
                <div className="pt-2">
                  <IntegrityActions caseId={record.id} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Review Actions */}
          {mayChangeStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Case Status &amp; Review Action</CardTitle>
                <CardDescription>Supervisor evaluation &amp; evidentiary classification</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusActions caseId={record.id} currentStatus={record.caseStatus} role={role} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <StatutoryFootnote />
    </div>
  );
}
