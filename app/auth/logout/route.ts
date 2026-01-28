import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/flowpilot-auth/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  clearSessionCookie(response);
  return response;
}

