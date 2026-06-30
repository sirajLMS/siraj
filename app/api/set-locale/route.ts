import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"];

export async function POST(request: NextRequest) {
  try {
    // CSRF protection: validate Origin header
    const origin = request.headers.get("origin");
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // Verify session cookie exists (authenticated user)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body: unknown = await request.json();

    // Type guard for locale validation
    if (
      !body ||
      typeof body !== "object" ||
      !("locale" in body) ||
      typeof body.locale !== "string" ||
      !["ar", "en"].includes(body.locale)
    ) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const locale = body.locale;

    // Set cookie on server side (works across all hostnames)
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json({ error: "Failed to set locale" }, { status: 500 });
  }
}
