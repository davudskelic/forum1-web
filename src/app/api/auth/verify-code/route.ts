import { NextRequest, NextResponse } from "next/server";
import { codeStore } from "@/lib/codeStore";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email je obavezan." }, { status: 400 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Kod je obavezan." }, { status: 400 });
    }

    const valid = codeStore.verify(email, code.trim());

    if (!valid) {
      return NextResponse.json({ error: "Kod je neispravan ili je istekao." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-code error:", err);
    return NextResponse.json({ error: "Greška pri verifikaciji." }, { status: 500 });
  }
}
