"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export const FeedbackManageDesktopPageShell = createTabbedPageShell(DesktopPageContainer);
export const FeedbackManageDesktopChrome = createTabbedPageChrome(DesktopPageHeader, 3);
