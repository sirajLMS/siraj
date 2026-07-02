import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"];

export async function POST(request: NextRequest) {
  try {
    // CSRF protection: validate Origin header
    const origin = request.headers.get("origin");
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // Security Note: This endpoint is intentionally public.
    // Locale updates do not expose sensitive data or actions.
    // CSRF protection via Origin header validation remains active.
    // Session-independent cookie (NEXT_LOCALE) is used for locale preference.

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
    const response = NextResponse.json({ success: true, locale });
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return response;

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json({ error: "Failed to set locale" }, { status: 500 });
  }
}
