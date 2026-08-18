"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export const FeedbackManageMobilePageShell = createTabbedPageShell(MobilePageContainer);
export const FeedbackManageMobileChrome = createTabbedPageChrome(MobilePageHeader, 2);
