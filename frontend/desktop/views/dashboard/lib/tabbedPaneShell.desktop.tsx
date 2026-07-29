"use client";

import type { ReactNode } from "react";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";

export function TabbedPaneDesktopShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}
