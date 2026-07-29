import { notFound } from "next/navigation";

/**
 * Catch unmatched dashboard URLs so they render `app/(dashboard)/not-found.tsx`
 * inside the authenticated dashboard layout instead of the root Next.js 404 page.
 *
 * Uses a required catch-all (`[...slug]`) rather than optional (`[[...slug]]`) so it
 * does not conflict with the root `app/page.tsx` route at `/`.
 */
export default function DashboardCatchAllPage() {
  notFound();
}
