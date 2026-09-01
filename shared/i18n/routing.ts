import { redirect as nextRedirect } from "next/navigation";

export { type AppLocale, locales } from "@/shared/locale/AppLocale";

export interface RedirectOptions {
  href: string;
  locale?: string;
}

export function redirect(options: RedirectOptions): never;
export function redirect(href: string): never;
export function redirect(hrefOrOptions: string | RedirectOptions): never {
  const href = typeof hrefOrOptions === "string" ? hrefOrOptions : hrefOrOptions.href;
  nextRedirect(href);
}
