"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

type ViewProps<T> = Readonly<T>;

export interface CreateLazyViewResult<T> {
  readonly mobile: ComponentType<ViewProps<T>>;
  readonly desktop: ComponentType<ViewProps<T>>;
}

const emptyLoading: () => ReactNode = () => null;

export function createLazyView<T>(
  mobileImporter: () => Promise<{ default: ComponentType<ViewProps<T>> }>,
  desktopImporter: () => Promise<{ default: ComponentType<ViewProps<T>> }>,
  options?: { readonly ssr?: boolean }
): CreateLazyViewResult<T> {
  const ssr = options?.ssr ?? true;
  return {
    mobile: dynamic(mobileImporter, { ssr, loading: emptyLoading }),
    desktop: dynamic(desktopImporter, { ssr, loading: emptyLoading }),
  };
}
