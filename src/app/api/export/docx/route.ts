import { casesForExport, exportFilename } from "@/lib/export/common";
import { renderDocx } from "@/lib/export/docx";
import { getSession } from "@/lib/session";
import { recordExport } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const { cases, caseId } = casesForExport(searchParams);

  if (cases.length === 0) {
    return new Response("No matching cases.", { status: 404 });
  }

  const buffer = await renderDocx(cases, session?.name ?? "unknown");

  if (session) {
    recordExport(session.name, `Exported ${cases.length} case(s) as DOCX`, caseId);
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${exportFilename("docx", caseId)}"`,
    },
  });
}
