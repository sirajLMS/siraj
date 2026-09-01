import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/", { includeRouter: true, locale: "en" });

// `@toolpad/core/useNotifications` requires a provider chain the TestWrapper
// does not supply — stub it before importing the ViewModel module.
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: () => {} }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, waitFor } from "@testing-library/react";
import { isValidElement, useEffect } from "react";

expect.extend(matchers);

import type { MeetingProvidersQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  type MeetingProvidersViewModel,
  useMeetingProvidersViewModel,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/useMeetingProvidersViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.MeetingProviders, locale);

const mockProviderRow = {
  id: "provider-1",
  slug: "zoom",
  name: { en: "Zoom" },
  description: null,
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123",
  logoUrl: null,
  providerKind: "auto",
  isActive: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: true,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
    __typename: "MeetingProviderFieldSchema",
  },
  __typename: "MeetingProvider",
};

const meetingProvidersMock = {
  request: { query: meetingProvidersQueryDocument, variables: { activeOnly: false } },
  result: { data: { meetingProviders: [mockProviderRow] } satisfies MeetingProvidersQuery },
};

let captured: MeetingProvidersViewModel | null = null;

function ViewModelConsumer() {
  const viewModel = useMeetingProvidersViewModel({});
  useEffect(() => {
    captured = viewModel;
  }, [viewModel]);
  return null;
}

function renderViewModel() {
  captured = null;
  renderWithWrapper(<ViewModelConsumer />, { locale, mocks: [meetingProvidersMock] });
}

function getViewModel(): MeetingProvidersViewModel {
  if (!captured) throw new Error("ViewModel was not captured");
  return captured;
}

/** Recursively strips function leaves so the payload must round-trip through JSON. */
function toPlainSerializableData(value: unknown): unknown {
  if (typeof value === "function") return undefined;
  if (Array.isArray(value)) return value.map(toPlainSerializableData);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nested]) => [key, toPlainSerializableData(nested)] as const)
        .filter(([, nested]) => nested !== undefined)
    );
  }
  return value;
}

function expectNoReactNodes(path: string, value: unknown, seen: ReadonlySet<object>): void {
  if (typeof value === "function" || typeof value !== "object" || value === null) return;
  expect(isValidElement(value), `${path} must not contain React elements`).toBe(false);
  if (seen.has(value)) return;
  const nextSeen = new Set(seen).add(value);
  for (const [key, nested] of Object.entries(value)) {
    expectNoReactNodes(`${path}.${key}`, nested, nextSeen);
  }
}

afterEach(() => cleanup());

describe("useMeetingProvidersViewModel purity", () => {
  test("returns rows and handlers without any columns entry", async () => {
    renderViewModel();
    await waitFor(() => {
      expect(getViewModel().loading).toBe(false);
    });

    const viewModel = getViewModel();
    expect("columns" in viewModel).toBe(false);
    expect(typeof viewModel.onEditRow).toBe("function");
    expect(typeof viewModel.onDeleteConfirm).toBe("function");
    expect(viewModel.rows).toHaveLength(1);
    expect(viewModel.rows[0]?.slug).toBe(mockProviderRow.slug);
    expect(viewModel.t.pageTitle).toBe(labels.pageTitle);
  });

  test("view model contains no React nodes", async () => {
    renderViewModel();
    await waitFor(() => {
      expect(getViewModel().loading).toBe(false);
    });

    for (const [key, value] of Object.entries(getViewModel())) {
      expectNoReactNodes(`viewModel.${key}`, value, new Set());
    }
  });

  test("non-function view model values are JSON-serializable", async () => {
    renderViewModel();
    await waitFor(() => {
      expect(getViewModel().loading).toBe(false);
    });

    const plainData = toPlainSerializableData(getViewModel());
    const roundTrip: unknown = JSON.parse(JSON.stringify(plainData));
    expect(roundTrip).toEqual(plainData);
    expect(plainData).toMatchObject({ rows: [mockProviderRow] });
  });
});
