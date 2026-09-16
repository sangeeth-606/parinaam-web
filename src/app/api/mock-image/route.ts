import { renderStripPng } from "@/lib/png";

// Deterministic placeholder "field photo" so case detail/PDF have an image
// without needing the real object store from the parinaam backend.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed") ?? "parinaam";
  const png = renderStripPng(seed);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
