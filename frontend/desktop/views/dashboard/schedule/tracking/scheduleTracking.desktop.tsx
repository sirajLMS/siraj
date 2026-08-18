"use client";

import { createTabbedPageChrome, createTabbedPageShell } from "@/frontend/common/views/dashboard/lib/tabbedPageShell";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export const ScheduleTrackingDesktopPageShell = createTabbedPageShell(DesktopPageContainer);
export const ScheduleTrackingDesktopChrome = createTabbedPageChrome(DesktopPageHeader, 3);
