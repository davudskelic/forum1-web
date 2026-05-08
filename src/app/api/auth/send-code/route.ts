import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { codeStore } from "@/lib/codeStore";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mojuniverzitet@gmail.com",
    pass: "ukpr nvxl ktbs bhvd",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email je obavezan." }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codeStore.set(email, code);

    await transporter.sendMail({
      from: '"Moj Univerzitet" <mojuniverzitet@gmail.com>',
      to: email,
      subject: "Kod za verifikaciju na 'MOJ UNIVERZITET' aplikaciju",
      text: `Vaš verifikacioni kod: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <img src="https://drive.usercontent.google.com/download?id=1oLzK3lKRu6KiVf7B5AtDFTb-E9aAy_C9&export=view" alt="moj univerzitet" style="width:52px;height:52px;border-radius:12px;object-fit:cover;display:block;margin:0 auto 20px;" />
          <h2 style="text-align:center;color:#111827;font-size:22px;margin:0 0 8px;">Verifikacioni kod</h2>
          <p style="text-align:center;color:#6b7280;font-size:14px;margin:0 0 16px;">Unesite ovaj kod u moj univerzitet aplikaciju</p>
          <p style="text-align:center;color:#374151;font-size:13px;margin:0 0 20px;">Kod važi <strong>10 minuta</strong>. Ako niste tražili ovaj kod, ignorirajte ovaj email.</p>
          <div style="background:white;border:2px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;">
            <span style="font-size:40px;font-weight:900;color:#111827;letter-spacing:10px;">${code}</span>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-code error:", err);
    return NextResponse.json({ error: "Greška pri slanju emaila." }, { status: 500 });
  }
}
