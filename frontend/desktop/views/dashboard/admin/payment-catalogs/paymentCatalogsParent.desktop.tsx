"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export const PaymentCatalogsDesktopPageShell = createTabbedPageShell(DesktopPageContainer);
export const PaymentCatalogsDesktopChrome = createTabbedPageChrome(DesktopPageHeader, 3);
