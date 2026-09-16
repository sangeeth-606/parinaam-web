import { NextResponse } from "next/server";

import { getCase } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }
  return NextResponse.json(record);
}
