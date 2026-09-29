import ExcelJS from "exceljs";

import { casesForExport, exportFilename } from "@/lib/export/common";
import { recordExport } from "@/lib/store";

const HEADERS = [
  "Case ID",
  "Date/Time (IST)",
  "District",
  "Department",
  "Officer",
  "Operator ID",
  "Device ID",
  "Kit Name",
  "Kit Model",
  "Kit Type",
  "Batch No",
  "Kit Expiry",
  "Outcome",
  "Confidence",
  "Delta E",
  "Quality Flags",
  "GPS Lat",
  "GPS Lon",
  "GPS Accuracy (m)",
  "GPS Mocked",
  "Image Hash",
  "Record Hash",
  "Integrity Seal (deviceAttestation)",
  "Device Security Level",
  "Case Status",
  "Panchnama Ref",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gate = await casesForExport(searchParams);
  if (!gate.ok) return gate.response;
  const { cases, caseId, session } = gate;

  if (cases.length === 0) {
    // Missing, foreign (scoped-out) and non-matching ids are indistinguishable.
    return new Response("No matching cases.", { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Parinaam Web Dashboard";
  const sheet = workbook.addWorksheet("Cases");

  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const c of cases) {
    sheet.addRow([
      c.id,
      new Date(c.createdAt).toLocaleString("en-IN"),
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
      c.gps.mocked ? "YES" : "no",
      c.imageHash,
      c.recordHash,
      c.deviceAttestation ?? "",
      c.deviceSecurityLevel ?? "",
      c.caseStatus,
      c.panchnamaRef ?? "",
    ]);
  }

  sheet.autoFilter = { from: "A1", to: { row: 1, column: HEADERS.length } };
  // One width per header column — kept in lockstep with HEADERS above.
  const COLUMN_WIDTHS = [
    12, 24, 16, 20, 16, 14, 14, 26, 14, 18, 16, 12, 14, 12, 10, 24, 12, 12, 16, 12, 64,
    64, 64, 20, 14, 24,
  ];
  if (COLUMN_WIDTHS.length !== HEADERS.length) {
    throw new Error(
      `XLSX column width count (${COLUMN_WIDTHS.length}) does not match header count (${HEADERS.length})`
    );
  }
  COLUMN_WIDTHS.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  await recordExport(session.name, "xlsx", caseId);

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFilename("xlsx", caseId)}"`,
    },
  });
}
