"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export const PaymentCatalogsMobilePageShell = createTabbedPageShell(MobilePageContainer);
export const PaymentCatalogsMobileChrome = createTabbedPageChrome(MobilePageHeader, 2);
