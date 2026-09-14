import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import {
  buildServerPaginationOptions,
  type ServerListPaginationOptions,
} from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  GroupsListShared,
  type GroupsListSharedProps,
  type GroupsListShellArgs,
} from "@/frontend/common/views/dashboard/whatsapp/groups/GroupsListShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { makeGroupRow } from "@/test/ui/components/whatsapp-groups/whatsappGroupsFixtures";

const locale: AppLocale = "en";

// The shared preload does not warm the groups namespace yet; prime the client
// translation cache the same way so the `readTranslation` call below returns
// synchronously instead of throwing a Suspense promise at module level.
async function primeGroupsNamespace(): Promise<void> {
  try {
    readTranslation(Translation.WhatsappGroups, locale);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      await thrown;
      return;
    }
    throw thrown;
  }
}
await primeGroupsNamespace();

const labels = readTranslation(Translation.WhatsappGroups, locale);

const noop = () => {};

const PAGINATION_OPTIONS: ServerListPaginationOptions = buildServerPaginationOptions({
  page: 0,
  pageSize: 20,
  totalCount: 40,
  onPageChange: noop,
});

const capturedArgs: GroupsListShellArgs[] = [];

/** Capturing stub shell: renders every slot and records the args it receives. */
function stubShell(args: GroupsListShellArgs): ReactNode {
  capturedArgs.push(args);
  return (
    <div>
      {args.toolbar}
      {args.skeleton}
      {args.empty}
      {args.rows.length > 0 && (
        <Stack aria-label={args.rowsAriaLabel}>
          {args.rows.map(row => (
            <div key={row.id}>{args.renderRow(row)}</div>
          ))}
        </Stack>
      )}
    </div>
  );
}

function makeProps(overrides: Partial<GroupsListSharedProps> = {}): GroupsListSharedProps {
  return {
    labels,
    search: "",
    onSearchChange: noop,
    groups: [],
    loading: false,
    selectedGroupId: null,
    paginationOptions: PAGINATION_OPTIONS,
    listShell: stubShell,
    onSelectGroup: noop,
    formatTimestamp: () => "2026-08-01",
    ...overrides,
  };
}

function renderGroups(props: GroupsListSharedProps) {
  return renderWithWrapper(<GroupsListShared {...props} />, { locale });
}

function lastArgs(): GroupsListShellArgs {
  return capturedArgs[capturedArgs.length - 1];
}

describe("GroupsListShared — tier list shell slot", () => {
  afterEach(() => {
    cleanup();
    capturedArgs.length = 0;
  });

  test("hands toolbar, rows, renderRow, pagination options and aria label to the shell slot", () => {
    const rows = [makeGroupRow("g-1"), makeGroupRow("g-2")];
    renderGroups(makeProps({ groups: rows }));
    const args = lastArgs();
    expect(args.rows).toEqual(rows);
    expect(args.paginationOptions.mode).toBe("server");
    expect(args.paginationOptions.page).toBe(0);
    expect(args.paginationOptions.pageSize).toBe(20);
    expect(args.paginationOptions.totalCount).toBe(40);
    expect(args.rowsAriaLabel).toBe(labels.listTitle);
    expect(document.querySelector(`[aria-label="${labels.listTitle}"]`)).not.toBeNull();
    expect(screen.getByPlaceholderText(labels.searchPlaceholder)).toBeVisible();
  });

  test("leaves the skeleton and empty slots null when rows exist", () => {
    renderGroups(makeProps({ groups: [makeGroupRow("g-1")] }));
    const args = lastArgs();
    expect(args.skeleton).toBeNull();
    expect(args.empty).toBeNull();
  });

  test("shows the pending FilterChip when the group has pending join requests", () => {
    renderGroups(makeProps({ groups: [makeGroupRow("g-1", { pendingJoinRequestCount: 2 })] }));
    expect(screen.getByText(labels.pendingBadge.replaceAll("{count}", "2"))).toBeVisible();
  });

  test("omits the pending FilterChip when there are no pending join requests", () => {
    renderGroups(makeProps({ groups: [makeGroupRow("g-1")] }));
    expect(screen.queryByText(labels.pendingBadge.replaceAll("{count}", "0"))).toBeNull();
  });

  test("shows the suspended badge on a suspended group", () => {
    renderGroups(makeProps({ groups: [makeGroupRow("g-1", { suspended: true })] }));
    expect(screen.getByText(labels.suspendedBadge)).toBeVisible();
    expect(screen.queryByText(labels.activeBadge)).toBeNull();
  });

  test("shows the active badge on an active group", () => {
    renderGroups(makeProps({ groups: [makeGroupRow("g-1", { suspended: false })] }));
    expect(screen.getByText(labels.activeBadge)).toBeVisible();
    expect(screen.queryByText(labels.suspendedBadge)).toBeNull();
  });

  test("delivers the skeleton branch and skips empty while the first page loads", () => {
    renderGroups(makeProps({ loading: true, groups: [] }));
    const args = lastArgs();
    expect(args.skeleton).not.toBeNull();
    expect(args.empty).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText(labels.emptyState)).toBeNull();
  });

  test("delivers the empty branch and skips skeleton when the tenant has no groups", () => {
    renderGroups(makeProps({ loading: false, groups: [] }));
    const args = lastArgs();
    expect(args.empty).not.toBeNull();
    expect(args.skeleton).toBeNull();
    expect(screen.getByText(labels.emptyState)).toBeVisible();
  });
});
