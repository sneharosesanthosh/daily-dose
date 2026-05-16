import { NextResponse } from "next/server";

export function proxy(request) {
  const adminSession = request.cookies.get("admin_session")?.value;
  if (adminSession !== "1") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
