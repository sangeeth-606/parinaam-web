import { NextResponse } from "next/server";

import { distinctFacets } from "@/lib/store";

export async function GET() {
  return NextResponse.json(distinctFacets());
}
