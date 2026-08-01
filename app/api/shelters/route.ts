import { NextRequest, NextResponse } from "next/server";
import { getSheltersForQuarteirao } from "@/lib/shelters/search";

export async function GET(request: NextRequest) {
  const quarteiraoId = request.nextUrl.searchParams.get("quarteiraoId");

  if (!quarteiraoId) {
    return NextResponse.json(
      { error: "quarteiraoId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const shelters = await getSheltersForQuarteirao(quarteiraoId);
    return NextResponse.json(shelters);
  } catch (error) {
    console.error("getSheltersForQuarteirao failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
