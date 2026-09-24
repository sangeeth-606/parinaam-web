import { casesForExport, exportFilename } from "@/lib/export/common";
import { renderDocx } from "@/lib/export/docx";
import { recordExport } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gate = await casesForExport(searchParams);
  if (!gate.ok) return gate.response;
  const { cases, caseId, session } = gate;

  if (cases.length === 0) {
    return new Response("No matching cases.", { status: 404 });
  }

  const buffer = await renderDocx(cases, session.name);

  recordExport(session.name, `Exported ${cases.length} case(s) as DOCX`, caseId);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${exportFilename("docx", caseId)}"`,
    },
  });
}
