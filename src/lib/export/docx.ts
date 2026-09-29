import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { EnrichedCase } from "@/lib/types";

function cell(text: string, opts?: { bold?: boolean; width?: number }) {
  return new TableCell({
    width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: opts?.bold, size: 18 })],
      }),
    ],
  });
}

function kvRow(key: string, value: string) {
  return new TableRow({
    children: [cell(key, { bold: true, width: 30 }), cell(value)],
  });
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, size: 24, bold: true })],
  });
}

const NO_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

export function buildCaseDoc(cases: EnrichedCase[], generatedBy: string): Document {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "PARINAAM", bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text:
            cases.length === 1
              ? `NDPS Field Test Record — ${cases[0].id}`
              : `NDPS Field Test Records — ${cases.length} case(s) (summary)`,
          size: 22,
          color: "475569",
        }),
      ],
    }),
  ];

  if (cases.length === 1) {
    const c = cases[0];
    children.push(
      heading("1. Identification"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          kvRow("Case ID", c.id),
          kvRow("Recorded At", new Date(c.createdAt).toLocaleString("en-IN")),
          kvRow("Device ID", c.deviceId),
          kvRow("Operator", `${c.operatorName} (${c.operatorId})`),
          kvRow("Department", c.department),
          kvRow("District", c.district),
        ],
      }),
      heading("2. Test Kit"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          kvRow("Kit", `${c.kit.name} (${c.kit.model})`),
          kvRow("Type", c.kit.kitType),
          kvRow("Batch No", c.kit.batchNo),
          kvRow("Expiry", c.kit.expiry),
        ],
      }),
      heading("3. Classification Result"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          kvRow("Outcome", `${c.classification.outcome} (PRESUMPTIVE — NOT CONFIRMATORY)`),
          kvRow(
            "Confidence",
            c.classification.confidence !== null
              ? `${(c.classification.confidence * 100).toFixed(1)}%`
              : "Not recorded"
          ),
          kvRow(
            "Delta E",
            c.classification.deltaE !== null
              ? String(c.classification.deltaE)
              : "Not measured"
          ),
          kvRow("Quality Flags", c.classification.qualityFlags.join(", ") || "None"),
        ],
      }),
      heading("4. Location"),
      c.gps.available
        ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            rows: [
              kvRow("Latitude", (c.gps.lat as number).toFixed(6)),
              kvRow("Longitude", (c.gps.lon as number).toFixed(6)),
              kvRow(
                "Accuracy",
                c.gps.accuracy !== null ? `±${c.gps.accuracy} m` : "Not recorded"
              ),
              kvRow("Provenance", c.gps.source ?? "Not recorded"),
              kvRow("GPS Mocked", c.gps.mocked ? "YES — FLAGGED" : "No"),
            ],
          })
        : new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            rows: [
              kvRow(
                "Capture position",
                "NOT AVAILABLE — no GPS fix recorded at capture"
              ),
              kvRow("GPS Mocked", c.gps.mocked ? "YES — FLAGGED" : "No"),
            ],
          }),
      heading("5. Integrity / Provenance"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          kvRow("Image Hash (SHA-256)", c.imageHash),
          kvRow("Record Hash (SHA-256)", c.recordHash),
          kvRow("Integrity Seal (deviceAttestation)", c.deviceAttestation ?? "Not recorded"),
          kvRow("Keystore Security Level", c.deviceSecurityLevel ?? "Not recorded"),
          kvRow("Panchnama Ref", c.panchnamaRef ?? "Not set"),
          kvRow("Case Status", c.caseStatus.replace("_", " ").toUpperCase()),
        ],
      }),
      new Paragraph({ spacing: { before: 240 }, children: [] }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text:
              "NOTICE: The colourimetric field test result recorded above is a PRESUMPTIVE INDICATOR ONLY. It is not a confirmatory laboratory assay and does not establish the identity of any substance. Confirmatory analysis by an accredited government laboratory is required under Rule 10(2) of the NDPS (Seizure, Storage, Sampling and Disposal) Rules, 2022.",
            size: 16,
            bold: true,
            color: "92400E",
          }),
        ],
      }),
      new Paragraph({ spacing: { before: 480 }, children: [] }),
      new Paragraph({
        children: [new TextRun({ text: "Investigating Officer: ______________________", size: 20 })],
      }),
      new Paragraph({
        spacing: { before: 240 },
        children: [new TextRun({ text: "Reviewing Supervisor: ______________________", size: 20 })],
      }),
      new Paragraph({
        spacing: { before: 360 },
        children: [
          new TextRun({
            text: `Generated by Parinaam Web Dashboard · ${generatedBy} · ${new Date().toLocaleString("en-IN")}`,
            size: 16,
            color: "94A3B8",
          }),
        ],
      })
    );
  } else {
    children.push(
      heading("Case Summary"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          new TableRow({
            children: [
              cell("Case ID", { bold: true }),
              cell("Date", { bold: true }),
              cell("District", { bold: true }),
              cell("Outcome", { bold: true }),
              cell("Status", { bold: true }),
            ],
          }),
          ...cases.map(
            (c) =>
              new TableRow({
                children: [
                  cell(c.id),
                  cell(new Date(c.createdAt).toLocaleDateString("en-IN")),
                  cell(c.district),
                  cell(c.classification.outcome),
                  cell(c.caseStatus.replace("_", " ")),
                ],
              })
          ),
        ],
      })
    );
  }

  return new Document({ sections: [{ children }] });
}

export async function renderDocx(cases: EnrichedCase[], generatedBy: string) {
  return Packer.toBuffer(buildCaseDoc(cases, generatedBy));
}

