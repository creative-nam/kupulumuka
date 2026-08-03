import { prisma } from "@/lib/db/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pairs = await prisma.bairroVizinho.findMany({
      select: { bairroAId: true, bairroBId: true },
    });

    return NextResponse.json(pairs);
  } catch (error) {
    console.error("bairroVizinho.findMany failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
