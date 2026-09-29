import { renderToBuffer } from "@react-pdf/renderer";

import { casesForExport, exportFilename } from "@/lib/export/common";
import { CourtPdf } from "@/lib/export/court-pdf";
import { recordExport } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const gate = await casesForExport(searchParams);
  if (!gate.ok) return gate.response;
  const { cases, caseId, session } = gate;

  if (cases.length !== 1) {
    return new Response(
      "PDF export requires exactly one case (?caseId=NDPS-100000). Use XLSX/CSV/DOCX for filtered sets.",
      { status: 400 }
    );
  }
  const record = cases[0];

  // Embed the genuine field photo (same-origin object URL) as a data URI.
  // If the record has no evidence image, the certificate is still issued and
  // the photo box renders empty — we never substitute a synthetic image.
  let imageDataUri: string | undefined;
  if (record.imageUrl) {
    try {
      const imageResponse = await fetch(`${origin}${record.imageUrl}`, {
        cache: "no-store",
      });
      if (imageResponse.ok && imageResponse.headers.get("content-type")?.startsWith("image/")) {
        const buf = Buffer.from(await imageResponse.arrayBuffer());
        imageDataUri = `data:${imageResponse.headers.get("content-type")};base64,${buf.toString("base64")}`;
      }
    } catch {
      // image optional in export
    }
  }

  const buffer = await renderToBuffer(
    <CourtPdf
      record={record}
      imageDataUri={imageDataUri}
      generatedBy={session.name}
      certificateLine={`NDPS Field Drug Test Certificate — ${record.id}`}
    />
  );

  await recordExport(session.name, "pdf", record.id);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${exportFilename("pdf", caseId)}"`,
    },
  });
}
