"use client";

import { useContext } from "react";
import { ViewportContext } from "@/frontend/common/context/ViewportContext";

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error("useViewport must be used within a ViewportProvider");
  }
  return context;
}
