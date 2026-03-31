import { NextRequest, NextResponse } from "next/server";
import { recordFailedAttempt } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req.headers);
  const body = await req.json() as { username?: string };
  await recordFailedAttempt(ip, body.username ?? "unknown");
  return NextResponse.json({ ok: true });
}
