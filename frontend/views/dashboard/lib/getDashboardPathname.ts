import { headers } from "next/headers";

export async function getDashboardPathname(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  if (pathname) {
    return pathname;
  }

  const referer = headersList.get("referer");
  if (referer) {
    try {
      return new URL(referer).pathname;
    } catch {
      // Fall through to default pathname.
    }
  }

  return "/ar/dashboard";
}
