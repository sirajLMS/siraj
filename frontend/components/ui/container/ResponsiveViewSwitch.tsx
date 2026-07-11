"use client";

import type { ReactNode } from "react";
import { useViewport } from "@/frontend/hooks/useViewport";

interface ResponsiveViewSwitchProps {
  readonly mobile: ReactNode;
  readonly desktop: ReactNode;
}

export function ResponsiveViewSwitch({ mobile, desktop }: ResponsiveViewSwitchProps) {
  const { isMobile } = useViewport();
  return isMobile ? mobile : desktop;
}
