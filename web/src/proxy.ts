import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (process.env.DASHBOARD_AUTH_DISABLED === "1") {
    return NextResponse.next();
  }

  const password = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.DASHBOARD_SECRET;
  if (!password || !secret) {
    return new NextResponse("Dashboard authentication is not configured", {
      status: 503,
    });
  }

  const authenticated = await verifySession(
    request.cookies.get(AUTH_COOKIE)?.value,
    secret,
  );
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
