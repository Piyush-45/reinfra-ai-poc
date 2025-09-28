// app/api/calls/route.ts
import { makePlivoCall } from "@/lib/plivo";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const body = await req.json();
  const to = body?.to;
  if (!to) return NextResponse.json({ error: "missing to" }, { status: 400 });

  const publicBase = process.env.PUBLIC_BASE_URL!;
  const answerUrl = `${publicBase}/api/plivo/answer`;

  try {
    const res = await makePlivoCall(to, process.env.PLIVO_FROM_NUMBER!, answerUrl);
    return NextResponse.json({ ok: true, res });
  } catch (err: any) {
    console.error("makePlivoCall err", err?.response?.data ?? err?.message ?? err);
    return NextResponse.json({ error: "call failed", details: err?.message }, { status: 500 });
  }
}
