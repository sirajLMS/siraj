import { getBooleanEnv } from "@/backend/lib/env";
import { DemoAuthService } from "@/backend/services/auth/demo-auth.service";
import { LoginContainer } from "@/frontend/views/auth/login";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Checks both env vars: NEXT_PUBLIC_IS_DEMO (client-accessible,controls UI) and
  // IS_DEMO (server-only, security-critical gate for demoLogin mutation).
  // Both are checked here since this is a Server Component that can access both.
  const isDemo = getBooleanEnv("NEXT_PUBLIC_IS_DEMO") || getBooleanEnv("IS_DEMO");
  let demoGroups: { slug: string; name: string; description: string | null }[] = [];

  if (isDemo) {
    demoGroups = await DemoAuthService.getAvailableDemoGroups(locale);
  }

  return <LoginContainer demoGroups={demoGroups} />;
}
