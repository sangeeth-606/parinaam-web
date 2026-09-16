import { ArrowLeft, MapPin, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusActions } from "@/components/cases/status-actions";
import { MapWrapper } from "@/components/map-wrapper";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { OutcomeBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getCase } from "@/lib/store";
import type { Role } from "@/lib/auth";
import { formatConfidence, formatDateTime } from "@/lib/utils";

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
  const record = getCase(id);
  if (!record) notFound();

  const session = (await getSession())!;

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={record.imageUrl}
                alt={`Field test photo for ${record.id}`}
                className="w-full rounded-md border"
              />
              <Row label="Image hash (SHA-256)" value={record.imageHash} mono />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Capture location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapWrapper
                points={[
                  {
                    id: record.id,
                    lat: record.gps.lat,
                    lon: record.gps.lon,
                    outcome: record.classification.outcome,
                    positive: record.classification.outcome === "positive",
                  },
                ]}
                center={[record.gps.lat, record.gps.lon]}
                zoom={11}
                height={260}
              />
              <div className="grid grid-cols-2 gap-x-4 pt-2">
                <Row label="Latitude" value={record.gps.lat.toFixed(6)} mono />
                <Row label="Longitude" value={record.gps.lon.toFixed(6)} mono />
                <Row label="Accuracy" value={`±${record.gps.accuracy} m`} />
                <Row label="GPS mocked" value={record.gps.mocked ? "YES" : "No"} />
              </div>
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
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, record.classification.confidence * 100)}%` }}
                      />
                    </span>
                    {formatConfidence(record.classification.confidence)}
                  </span>
                }
              />
              <Row label="Delta E (color distance)" value={record.classification.deltaE} />
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
            <CardContent>
              <Row label="Record hash" value={record.recordHash} mono />
              <Row label="Signature" value={record.signature} mono />
              <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Record data is immutable on this dashboard — hashes and the signature are owned
                by the backend. Reviewers may only change the case status and panchnama
                reference below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review state</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions
                caseId={record.id}
                currentStatus={record.caseStatus}
                currentPanchnamaRef={record.panchnamaRef}
                role={session.role as Role}
              />
            </CardContent>
          </Card>

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



