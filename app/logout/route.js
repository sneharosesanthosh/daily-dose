import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.redirect(new URL("/", request.url));
}
