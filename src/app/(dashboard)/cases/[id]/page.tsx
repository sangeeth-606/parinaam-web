import { ArrowLeft, MapPin, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusActions } from "@/components/cases/status-actions";
import { IntegrityActions } from "@/components/cases/integrity-actions";
import { MapWrapper } from "@/components/map-wrapper";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { OutcomeBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getCase } from "@/lib/store";
import { can, type Role } from "@/lib/auth";
import { formatConfidence, formatDateTime } from "@/lib/utils";

import { PresumptiveBanner } from "@/components/presumptive-banner";

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</span>
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
  // RBAC: scope-filtered lookup — a field officer opening a foreign record
  // gets the same 404 as a typo'd id (no existence probing).
  const record = await getCase(id, session);
  if (!record) notFound();

  const role = session.role as Role;
  const mayChangeStatus = can(role, "records.change_status");
  const mayRecompute = can(role, "records.recompute_integrity");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/cases">
            <Button variant="ghost" size="icon" title="Back to case log">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-semibold tracking-tight">{record.id}</h1>
              <StatusBadge status={record.caseStatus} />
              <OutcomeBadge outcome={record.classification.outcome} />
            </div>
            <p className="text-sm text-muted-foreground">
              Recorded {formatDateTime(record.createdAt)} · {record.operatorName} · {record.district}
            </p>
          </div>
        </div>
        {/* Exports — PDF is the court-ready certificate */}
        <div className="flex items-center gap-2">
          <a href={`/api/export/pdf?caseId=${record.id}`}>
            <Button size="sm">Court PDF</Button>
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
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <TriangleAlert className="h-4 w-4" />
          <span>
            Integrity alert: this record reports <strong>mocked GPS</strong> coordinates.
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left: image + map */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Field photo</CardTitle>
            </CardHeader>
            <CardContent>
              {record.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.imageUrl}
                    alt={`Field test photo for ${record.id}`}
                    className="w-full rounded-md border"
                  />
                  <Row label="Image hash (SHA-256)" value={record.imageHash} mono />
                </>
              ) : (
                // No blob on file. We say so plainly rather than rendering a
                // synthetic test strip that could be mistaken for evidence.
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    No evidence image on file
                  </p>
                  <p className="mt-1">
                    This record carries no image hash. The capture either
                    recorded no photograph or the blob has not yet synced. No
                    placeholder image is shown, because a synthetic image must
                    never be presented as seizure evidence.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Capture location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {record.gps.available ? (
                <>
                  <MapWrapper
                    points={[
                      {
                        id: record.id,
                        lat: record.gps.lat as number,
                        lon: record.gps.lon as number,
                        outcome: record.classification.outcome,
                        positive:
                          record.classification.outcome ===
                          "CONSISTENT_WITH_REAGENT_POSITIVE",
                      },
                    ]}
                    center={[record.gps.lat as number, record.gps.lon as number]}
                    zoom={11}
                    height={260}
                  />
                  <div className="grid grid-cols-2 gap-x-4 pt-2">
                    <Row label="Latitude" value={(record.gps.lat as number).toFixed(6)} mono />
                    <Row label="Longitude" value={(record.gps.lon as number).toFixed(6)} mono />
                    <Row
                      label="Accuracy"
                      value={
                        record.gps.accuracy !== null
                          ? `±${record.gps.accuracy} m`
                          : "Not recorded"
                      }
                    />
                    <Row
                      label="Provenance"
                      value={record.gps.source ?? "Not recorded"}
                    />
                    <Row label="GPS mocked" value={record.gps.mocked ? "YES" : "No"} />
                  </div>
                </>
              ) : (
                // No position was captured. We do not fall back to a city
                // centroid — an invented coordinate is false evidence.
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Position unavailable
                  </p>
                  <p className="mt-1">
                    The device recorded no usable GPS fix for this seizure, so no
                    map position can be shown. No default or approximate
                    coordinate is substituted.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle: read-only record data */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Classification result</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Outcome" value={record.classification.outcome} />
              <Row
                label="Confidence"
                value={
                  record.classification.confidence !== null ? (
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, record.classification.confidence * 100)}%`,
                          }}
                        />
                      </span>
                      {formatConfidence(record.classification.confidence)}
                    </span>
                  ) : (
                    "Not recorded by device"
                  )
                }
              />
              <Row
                label="Delta E (CIE L*a*b* colour distance)"
                value={
                  record.classification.deltaE !== null
                    ? record.classification.deltaE
                    : "Not measured"
                }
              />
              <Row
                label="Quality flags"
                value={
                  record.classification.qualityFlags.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {record.classification.qualityFlags.map((f) => (
                        <span key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                          {f}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "None"
                  )
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test kit</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Kit" value={`${record.kit.name} (${record.kit.model})`} />
              <Row label="Type" value={record.kit.kitType} />
              <Row label="Batch no" value={record.kit.batchNo} mono />
              <Row label="Expiry" value={record.kit.expiry} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operator &amp; device</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Officer" value={`${record.operatorName} (${record.operatorId})`} />
              <Row label="Department" value={record.department} />
              <Row label="Device ID" value={record.deviceId} mono />
              <Row label="Recorded at" value={formatDateTime(record.createdAt)} />
            </CardContent>
          </Card>
        </div>

        {/* Right: integrity + review actions + SIMS */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Integrity / provenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Record hash (SHA-256)" value={record.recordHash} mono />
              <Row
                label="Integrity seal (deviceAttestation)"
                value={record.deviceAttestation ?? "Not recorded"}
                mono
              />
              <Row
                label="Keystore security level"
                value={record.deviceSecurityLevel ?? "Not recorded"}
              />
              <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                Record data is immutable on this dashboard — hashes and the
                integrity seal are owned by the backend. This is a device
                attestation, not a digital or PKI signature; no statutory
                Certifying Authority backs it. Every recompute below is recorded
                in the audit trail.
              </p>
              {mayRecompute && <IntegrityActions caseId={record.id} />}
            </CardContent>
          </Card>

          {/* RBAC: records.change_status — reviewers only; others never see the form. */}
          {mayChangeStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Review state</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusActions
                  caseId={record.id}
                  currentStatus={record.caseStatus}
                  currentPanchnamaRef={record.panchnamaRef}
                  role={role}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Review state</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={record.caseStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Panchnama reference</span>
                  <span className="font-mono text-xs">
                    {record.panchnamaRef ?? "—"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Read-only: your role cannot change case review state. Only
                  supervisors and administrators hold the{" "}
                  <span className="font-mono">records.change_status</span>{" "}
                  capability.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5">
              <SimsPlaceholder caseId={record.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



