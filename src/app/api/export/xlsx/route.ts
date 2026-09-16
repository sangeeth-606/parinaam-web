import ExcelJS from "exceljs";

import { casesForExport, exportFilename } from "@/lib/export/common";
import { recordExport } from "@/lib/store";
import { getSession } from "@/lib/session";

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
  "Signature",
  "Case Status",
  "Panchnama Ref",
];

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const { cases, caseId } = casesForExport(searchParams);

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
      c.signature,
      c.caseStatus,
      c.panchnamaRef ?? "",
    ]);
  }

  sheet.autoFilter = { from: "A1", to: { row: 1, column: HEADERS.length } };
  [12, 24, 16, 20, 16, 14, 14, 26, 14, 18, 16, 12, 14, 12, 10, 24, 12, 12, 16, 12, 64, 64, 64, 14, 24].forEach(
    (width, i) => {
      sheet.getColumn(i + 1).width = width;
    }
  );

  const buffer = await workbook.xlsx.writeBuffer();
  if (session) {
    recordExport(
      session.name,
      `Exported ${cases.length} case(s) as XLSX`,
      caseId
    );
  }

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFilename("xlsx", caseId)}"`,
    },
  });
}
