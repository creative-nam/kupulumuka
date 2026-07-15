import { prisma } from "@/lib/db/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
  const pairs = await prisma.bairroVizinho.findMany({
    select: { bairroAId: true, bairroBId: true },
  });

  return NextResponse.json(pairs);
}
