import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  safeNext,
} from "@/lib/auth";

export const runtime = "nodejs";

function requestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(/:$/, "");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.DASHBOARD_SECRET;
  if (process.env.DASHBOARD_AUTH_DISABLED !== "1" && (!password || !secret)) {
    return NextResponse.json(
      { error: "Dashboard authentication is not configured" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const submitted = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  if (process.env.DASHBOARD_AUTH_DISABLED !== "1") {
    const submittedHash = createHash("sha256").update(submitted).digest();
    const expectedHash = createHash("sha256").update(password!).digest();
    if (!timingSafeEqual(submittedHash, expectedHash)) {
      const login = new URL("/login", requestOrigin(request));
      login.searchParams.set("error", "1");
      if (next !== "/") login.searchParams.set("next", next);
      return NextResponse.redirect(login, 303);
    }
  }

  const response = NextResponse.redirect(
    new URL(next, requestOrigin(request)),
    303,
  );
  if (secret) {
    const token = await createSession(SESSION_MAX_AGE, secret);
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }
  return response;
}
