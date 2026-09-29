import { NextResponse } from "next/server";

import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";

// Serves the genuine sealed evidence photo from `evidence_blobs`.
//
// Honesty rules enforced here:
//  * No synthetic/placeholder image is ever generated. If the blob is absent we
//    return 404, so a fabricated test strip can never be presented as evidence.
//  * The route is session-gated: evidence photos are case material, not public
//    assets, and must not be readable by unauthenticated callers.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { hash } = await params;

  // Only accept a well-formed SHA-256 hex digest so the value is safe to bind
  // as a query parameter and cannot be used to probe other columns.
  if (!/^[0-9a-f]{64}$/i.test(hash)) {
    return NextResponse.json({ error: "Invalid evidence hash." }, { status: 400 });
  }

  try {
    const blob = await queryOne<{ content_type: string; bytes: Buffer }>(
      "SELECT content_type, bytes FROM evidence_blobs WHERE sha256 = $1 LIMIT 1",
      [hash.toLowerCase()]
    );

    if (blob?.bytes) {
      return new Response(new Uint8Array(blob.bytes), {
        headers: {
          "Content-Type": blob.content_type || "application/octet-stream",
          "Content-Length": String(blob.bytes.length),
          // Content-addressed: the bytes can never change for a given digest.
          "Cache-Control": "private, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch (error) {
    console.error("Error querying evidence_blobs:", error);
    return NextResponse.json(
      { error: "Evidence lookup failed." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "No evidence blob on file for this hash." },
    { status: 404 }
  );
}
