"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export const BillingDesktopPageShell = createTabbedPageShell(DesktopPageContainer);
export const BillingDesktopChrome = createTabbedPageChrome(DesktopPageHeader, 3);
