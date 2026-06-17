import { DemoAuthService } from "@/backend/services/auth/demo-auth.service";
import { LoginContainer } from "@/frontend/views/auth/login";

export default async function LoginPage() {
  const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === "true" || process.env.IS_DEMO === "true";
  let demoGroups: { slug: string; name: string; description: string | null }[] = [];

  if (isDemo) {
    demoGroups = await DemoAuthService.getAvailableDemoGroups();
  }

  return <LoginContainer demoGroups={demoGroups} />;
}
