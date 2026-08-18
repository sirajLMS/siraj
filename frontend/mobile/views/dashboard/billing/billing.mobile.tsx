"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export const BillingMobilePageShell = createTabbedPageShell(MobilePageContainer);
export const BillingMobileChrome = createTabbedPageChrome(MobilePageHeader, 2);
