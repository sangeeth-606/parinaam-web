import { casesForExport, exportFilename } from "@/lib/export/common";
import { recordExport } from "@/lib/store";

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gate = await casesForExport(searchParams);
  if (!gate.ok) return gate.response;
  const { cases, caseId, session } = gate;

  if (cases.length === 0) {
    // Missing, foreign (scoped-out) and non-matching ids are indistinguishable.
    return new Response("No matching cases.", { status: 404 });
  }

  const header = [
    "case_id",
    "created_at",
    "district",
    "department",
    "officer",
    "operator_id",
    "device_id",
    "kit_name",
    "kit_model",
    "kit_type",
    "kit_batch_no",
    "kit_expiry",
    "outcome",
    "confidence",
    "delta_e",
    "quality_flags",
    "gps_lat",
    "gps_lon",
    "gps_accuracy_m",
    "gps_mocked",
    "image_hash",
    "record_hash",
    "integrity_seal_device_attestation",
    "device_security_level",
    "case_status",
    "panchnama_ref",
  ];

  const lines = [header.join(",")];
  for (const c of cases) {
    lines.push(
      [
        c.id,
        c.createdAt,
        c.district,
        c.department,
        c.operatorName,
        c.operatorId,
        c.deviceId,
        c.kit.name,
        c.kit.model,
        c.kit.kitType,
        c.kit.batchNo,
        c.kit.expiry,
        c.classification.outcome,
        c.classification.confidence,
        c.classification.deltaE,
        c.classification.qualityFlags.join("; "),
        c.gps.lat,
        c.gps.lon,
        c.gps.accuracy,
        c.gps.mocked,
        c.imageHash,
        c.recordHash,
        c.deviceAttestation ?? "",
        c.deviceSecurityLevel ?? "",
        c.caseStatus,
        c.panchnamaRef ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  await recordExport(session.name, "csv", caseId);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename("csv", caseId)}"`,
    },
  });
}
