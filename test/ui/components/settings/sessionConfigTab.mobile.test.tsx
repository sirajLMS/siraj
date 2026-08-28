import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));
await mock.module("@/frontend/common/lib/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", { href, ...rest }, children),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.SettingsSession, locale);

import type {
  SessionConfigRow,
  SessionConfigTabViewModel,
} from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { SessionConfigTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/session/sessionConfigTab.mobile";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function buildViewModel(overrides?: Partial<SessionConfigTabViewModel>): SessionConfigTabViewModel {
  return {
    rows: [],
    loading: false,
    canManage: true,
    labels,
    formOpen: false,
    editRow: null,
    deleteRow: null,
    isDeleting: false,
    onAdd: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onFormClose: () => {},
    onDeleteClose: () => {},
    onSaved: async () => {},
    onConfirmDelete: async () => {},
    ...overrides,
  };
}

const sampleRow: SessionConfigRow = {
  id: "session-1",
  roleName: "Student",
  ttlSeconds: 3600,
  maxConcurrentSessions: 3,
};

describe("SessionConfigTab — mobile", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders section panel title and subtitle", async () => {
    renderWithWrapper(<SessionConfigTabMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.title)).toBeInTheDocument();
      expect(screen.getByText(labels.subtitle)).toBeInTheDocument();
    });
  });

  test("renders empty state when there are no rows", async () => {
    renderWithWrapper(<SessionConfigTabMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.empty)).toBeInTheDocument();
    });
  });

  test("renders session config rows in the card list", async () => {
    renderWithWrapper(<SessionConfigTabMobileView {...buildViewModel({ rows: [sampleRow] })} />, {
      locale,
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText(sampleRow.roleName)).toBeInTheDocument();
    });
    expect(screen.getByText(`${labels.ttlSecondsColumn}: ${sampleRow.ttlSeconds}`)).toBeInTheDocument();
    expect(
      screen.getByText(`${labels.maxConcurrentSessionsColumn}: ${sampleRow.maxConcurrentSessions}`)
    ).toBeInTheDocument();
  });
});
