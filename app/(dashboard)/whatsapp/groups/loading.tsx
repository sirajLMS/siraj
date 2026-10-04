import { RouteLoadingSkeleton } from "@/app/(dashboard)/__shared__";

/**
 * Route-level loading for the WhatsApp groups list page.
 * Renders while the page.tsx server component is resolving.
 */
export default function Loading() {
  return <RouteLoadingSkeleton />;
}
