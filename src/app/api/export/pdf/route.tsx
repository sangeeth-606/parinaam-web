import { renderToBuffer } from "@react-pdf/renderer";

import { casesForExport, exportFilename } from "@/lib/export/common";
import { CourtPdf } from "@/lib/export/court-pdf";
import { getSession } from "@/lib/session";
import { recordExport } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams, origin } = new URL(request.url);
  const { cases, caseId } = casesForExport(searchParams);

  if (cases.length !== 1) {
    return new Response(
      "PDF export requires exactly one case (?caseId=NDPS-100000). Use XLSX/CSV/DOCX for filtered sets.",
      { status: 400 }
    );
  }
  const record = cases[0];

  // Embed the field photo (same-origin object URL) as a data URI.
  let imageDataUri: string | undefined;
  try {
    const imageResponse = await fetch(`${origin}${record.imageUrl}`, {
      cache: "no-store",
    });
    if (imageResponse.ok) {
      const buf = Buffer.from(await imageResponse.arrayBuffer());
      imageDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch {
    // image optional in export
  }

  const buffer = await renderToBuffer(
    <CourtPdf
      record={record}
      imageDataUri={imageDataUri}
      generatedBy={session?.name ?? "unknown"}
      certificateLine={`NDPS Field Drug Test Certificate — ${record.id}`}
    />
  );

  if (session) {
    recordExport(
      session.name,
      `Exported ${record.id} as court-ready PDF`,
      record.id
    );
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${exportFilename("pdf", caseId)}"`,
    },
  });
}
