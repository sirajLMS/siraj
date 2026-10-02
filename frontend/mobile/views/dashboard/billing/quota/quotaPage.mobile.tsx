"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export const QuotaMobilePageShell = createTabbedPageShell(MobilePageContainer);
export const QuotaMobilePageChrome = createTabbedPageChrome(MobilePageHeader, 2);
