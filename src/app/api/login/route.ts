import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === process.env.DASHBOARD_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("memory_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid" }, { status: 401 });
}
