"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";

interface TabbedPageLabels {
  readonly title: string;
  readonly subtitle?: string;
  readonly tabNavAriaLabel: string;
}

interface TabbedChromeProps<TabId extends string = string> {
  readonly labels: TabbedPageLabels;
  readonly activeTab: TabId;
  readonly tabNavItems: readonly { readonly id: TabId; readonly label: string; readonly href: string }[];
}

type PageContainerComponent = (props: Readonly<{ readonly children: ReactNode }>) => ReactNode;

type PageHeaderComponent = (
  props: Readonly<{
    readonly title: string;
    readonly subtitle?: string;
    readonly breadcrumbOptions?: { readonly currentTitle: string };
  }>
) => ReactNode;

export function createTabbedPageShell(PageContainer: PageContainerComponent) {
  return function TabbedPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
    return <PageContainer>{children}</PageContainer>;
  };
}

export function createTabbedPageChrome(PageHeader: PageHeaderComponent, mt: number) {
  return function TabbedPageChrome<TabId extends string>({
    labels,
    activeTab,
    tabNavItems,
  }: Readonly<TabbedChromeProps<TabId>>) {
    return (
      <>
        <PageHeader
          title={labels.title}
          subtitle={labels.subtitle}
          breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) ?? labels.title }}
        />
        <Box sx={{ mt }}>
          <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
        </Box>
      </>
    );
  };
}
