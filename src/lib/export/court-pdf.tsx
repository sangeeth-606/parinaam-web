// Court-ready PDF — @react-pdf/renderer, rendered server-side so every
// exported byte is identical regardless of which client requested it.

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { EnrichedCase } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
    gap: 10,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0d355e",
    paddingBottom: 8,
    marginBottom: 4,
  },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0d355e" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 2 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0d355e",
    marginBottom: 4,
    marginTop: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  cell: { width: "50%", flexDirection: "row", paddingVertical: 2 },
  cellLabel: { width: 100, color: "#64748b" },
  cellValue: { fontFamily: "Helvetica-Bold", flex: 1 },
  mono: { fontFamily: "Courier", fontSize: 8 },
  row: { flexDirection: "row", gap: 12 },
  imageBox: {
    width: 220,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 6,
  },
  image: { width: "100%", height: 150, objectFit: "contain" },
  imageCaption: { fontSize: 7, color: "#64748b", marginTop: 4 },
  hashBlock: {
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 4,
    gap: 3,
  },
  noticeBox: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 3,
    borderLeftColor: "#d97706",
    padding: 8,
    borderRadius: 4,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
  },
  noticeBody: { fontSize: 7.5, color: "#78350f", lineHeight: 1.35 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  signature: { width: "45%", borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 4, fontSize: 8, color: "#475569" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#94a3b8",
    flexDirection: "row",
  },
});

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell} wrap={false}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

export interface CourtPdfProps {
  record: EnrichedCase;
  imageDataUri?: string;
  generatedBy: string;
  certificateLine: string;
}

export function CourtPdf({ record, imageDataUri, generatedBy, certificateLine }: CourtPdfProps) {
  const c = record;
  return (
    <Document
      title={`Parinaam NDPS Field Test Record ${c.id}`}
      author="Parinaam"
      subject="NDPS Field Drug Test Certificate"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>PARINAAM</Text>
          <Text style={styles.subtitle}>{certificateLine}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.imageBox}>
            {imageDataUri ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.image} src={imageDataUri} />
            ) : (
              <View style={[styles.image, { backgroundColor: "#f1f5f9" }]} />
            )}
            <Text style={styles.imageCaption}>
              {imageDataUri
                ? "Field photo — the sealed capture image, served from evidence_blobs"
                : "NO EVIDENCE IMAGE ON FILE — no photograph was captured or synced for this record"}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>1. IDENTIFICATION</Text>
            <View style={styles.grid}>
              <KV label="Case ID" value={c.id} />
              <KV label="Recorded At" value={new Date(c.createdAt).toLocaleString("en-IN")} />
              <KV label="Device" value={c.deviceId} />
              <KV label="Operator" value={`${c.operatorName} (${c.operatorId})`} />
              <KV label="Department" value={c.department} />
              <KV label="District" value={c.district} />
            </View>

            <Text style={styles.sectionTitle}>2. CLASSIFICATION RESULT</Text>
            <View style={styles.grid}>
              <KV
                label="Outcome"
                value={`${c.classification.outcome} (PRESUMPTIVE — NOT CONFIRMATORY)`}
              />
              <KV
                label="Confidence"
                value={
                  c.classification.confidence !== null
                    ? `${(c.classification.confidence * 100).toFixed(1)}%`
                    : "Not recorded"
                }
              />
              <KV
                label="Delta E"
                value={c.classification.deltaE !== null ? String(c.classification.deltaE) : "Not measured"}
              />
              <KV label="Quality Flags" value={c.classification.qualityFlags.join(", ") || "None"} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>3. TEST KIT</Text>
        <View style={styles.grid}>
          <KV label="Kit" value={`${c.kit.name} (${c.kit.model})`} />
          <KV label="Type" value={c.kit.kitType} />
          <KV label="Batch No" value={c.kit.batchNo} />
          <KV label="Expiry" value={c.kit.expiry} />
        </View>

        <Text style={styles.sectionTitle}>4. LOCATION</Text>
        <View style={styles.grid}>
          {c.gps.available ? (
            <>
              <KV label="Latitude" value={(c.gps.lat as number).toFixed(6)} />
              <KV label="Longitude" value={(c.gps.lon as number).toFixed(6)} />
              <KV
                label="Accuracy"
                value={c.gps.accuracy !== null ? `±${c.gps.accuracy} m` : "Not recorded"}
              />
              <KV label="Provenance" value={c.gps.source ?? "Not recorded"} />
            </>
          ) : (
            <KV label="Capture position" value="NOT AVAILABLE — no GPS fix recorded at capture" />
          )}
          <KV label="GPS Mocked" value={c.gps.mocked ? "YES — FLAGGED" : "No"} />
        </View>

        <Text style={styles.sectionTitle}>5. INTEGRITY / PROVENANCE</Text>
        <View style={styles.hashBlock}>
          <Text style={styles.mono}>imageHash            {c.imageHash}</Text>
          <Text style={styles.mono}>recordHash           {c.recordHash}</Text>
          <Text style={styles.mono}>integritySeal         {c.deviceAttestation ?? "Not recorded"}</Text>
          <Text style={styles.mono}>keystoreSecurityLevel{c.deviceSecurityLevel ?? "Not recorded"}</Text>
          <Text style={styles.mono}>panchnama            {c.panchnamaRef ?? "Not set"}</Text>
          <Text style={styles.mono}>status               {c.caseStatus.replace("_", " ").toUpperCase()}</Text>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>MANDATORY NOTICE — PRESUMPTIVE INDICATOR ONLY</Text>
          <Text style={styles.noticeBody}>
            The colourimetric field test result recorded in this certificate is a PRESUMPTIVE
            INDICATOR ONLY. It is not a confirmatory laboratory assay, and it does not establish
            the identity of any substance. No conclusion as to the substance seized may be drawn
            from it. Confirmatory qualitative and quantitative analysis by an accredited
            government forensic laboratory is required under Rule 10(2) of the NDPS (Seizure,
            Storage, Sampling and Disposal) Rules, 2022. This certificate is issued in
            satisfaction of Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.
          </Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signature}>Investigating Officer</Text>
          <Text style={styles.signature}>Reviewing Supervisor</Text>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated by Parinaam Web Dashboard · ${generatedBy} · ${new Date().toLocaleString("en-IN")}  ·  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

