import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter, redirect as nextRedirect } from "next/navigation";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

export { type AppLocale, defaultLocale, locales };
export type Locale = AppLocale;

export type Pathname = string;

export interface RoutingConfig {
  locales: readonly AppLocale[];
  defaultLocale: AppLocale;
  localePrefix: "never";
}

export const routing: RoutingConfig = {
  locales,
  defaultLocale,
  localePrefix: "never",
};

export type LinkProps = ComponentProps<typeof Link>;
export { Link };

export function usePathname(): Pathname {
  return useNextPathname();
}

export interface AppRouter {
  push(href: string, options?: { scroll?: boolean }): void;
  replace(href: string, options?: { scroll?: boolean }): void;
  back(): void;
  forward(): void;
  refresh(): void;
  prefetch(href: string): void;
}

export function useRouter(): AppRouter {
  return useNextRouter() as AppRouter;
}

interface RedirectOptions {
  href: string;
  locale?: AppLocale;
}

export function redirect(options: RedirectOptions): never;
export function redirect(href: string): never;
export function redirect(hrefOrOptions: string | RedirectOptions): never {
  const href = typeof hrefOrOptions === "string" ? hrefOrOptions : hrefOrOptions.href;
  nextRedirect(href);
}
