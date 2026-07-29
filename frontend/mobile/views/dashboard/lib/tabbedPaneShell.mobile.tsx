"use client";

import type { ReactNode } from "react";
import { MobilePageContainer } from "@/frontend/mobile/components/ui";

export function TabbedPaneMobileShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}
