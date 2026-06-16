import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
      httpOnly: false, // Allow client-side access
    });

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json({ error: "Failed to set locale" }, { status: 500 });
  }
}
