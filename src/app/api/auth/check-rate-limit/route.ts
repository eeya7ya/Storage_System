import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req.headers);
  const { blocked, remaining } = await checkRateLimit(ip);
  return NextResponse.json({ blocked, remaining });
}
