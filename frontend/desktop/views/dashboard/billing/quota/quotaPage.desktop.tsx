"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export const QuotaDesktopPageShell = createTabbedPageShell(DesktopPageContainer);
export const QuotaDesktopPageChrome = createTabbedPageChrome(DesktopPageHeader, 3);
