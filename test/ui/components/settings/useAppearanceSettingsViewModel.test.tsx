import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { type RefObject, useEffect } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

expect.extend(matchers);

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.Settings, locale).appearance;

const routerPush = mock((_url: string) => {});
await mockNextNavigation("/dashboard/settings", { locale: "en", mockPush: routerPush });

// `@toolpad/core/useNotifications` requires a provider chain the TestWrapper
// does not set up; capture `show` calls for assertions.
const showNotification = mock(() => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

import {
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { DEFAULT_APPEARANCE_DRAFT, useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { useAppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/tabs/appearance/useAppearanceSettingsViewModel";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import { renderWithWrapper, TestWrapper } from "@/test/ui/components/TestWrapper";

let vmRef: RefObject<AppearanceSettingsViewModel | null>;

function ViewModelConsumer() {
  const vm = useAppearanceSettingsViewModel();
  useEffect(() => {
    vmRef.current = vm;
  });
  return <div data-testid="appearance-vm" />;
}

function resetAppearanceStore(): void {
  useAppearancePreviewStore.setState(
    {
      draft: DEFAULT_APPEARANCE_DRAFT,
      dirty: false,
      resetDialogOpen: false,
      presetId: "default",
      lastPublished: null,
    },
    false
  );
}

const appearanceRow = {
  __typename: "AppearanceSettings",
  id: "appearance",
  primaryMain: "#0D9488",
  secondaryMain: "#4F46E5",
  logoUrl: null,
  siteName: "Siraj",
  siteTitle: "Siraj",
  siteDescription: "Siraj education management",
  defaultColorScheme: "dark",
  draftFields: {
    __typename: "AppearanceFields",
    colors: {
      __typename: "AppearanceColors",
      light: { __typename: "AppearanceColorPair", primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
      dark: { __typename: "AppearanceColorPair", primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
    },
    logoUrl: null,
    siteName: "Siraj",
    siteTitle: "Siraj",
    siteDescription: "Siraj education management",
    defaultColorScheme: "dark",
  },
  updatedByUserId: "user-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

// The draft the tab sends after a `setField("siteName", ...)` edit — the
// ViewModel passes the in-memory store draft straight through when there is
// no data-URL logo to upload. Apollo MockLink requires an exact match on
// serialized variables, so `expectedUpdatedAt: undefined` must be OMITTED.
const EDITED_DRAFT = { ...DEFAULT_APPEARANCE_DRAFT, siteName: "Changed Name" };

const saveDraftMock = () => ({
  request: { query: saveAppearanceDraftMutationDocument, variables: { input: EDITED_DRAFT } },
  result: { data: { saveAppearanceDraft: appearanceRow } },
});

const saveDraftErrorMock = () => ({
  request: { query: saveAppearanceDraftMutationDocument, variables: { input: EDITED_DRAFT } },
  error: new Error("save failed"),
});

const publishMock = () => ({
  request: { query: publishAppearanceMutationDocument, variables: {} },
  result: { data: { publishAppearance: appearanceRow } },
});

const resetMock = () => ({
  request: { query: resetAppearanceDraftMutationDocument, variables: {} },
  result: { data: { resetAppearanceDraft: appearanceRow } },
});

beforeEach(() => {
  vmRef = { current: null };
  resetAppearanceStore();
});

afterEach(() => {
  cleanup();
  vmRef = { current: null };
  showNotification.mockClear();
  routerPush.mockClear();
  resetAppearanceStore();
});

function renderViewModel(mocks: MockLink.MockedResponse[]) {
  renderWithWrapper(<ViewModelConsumer />, { locale, mocks });
  return waitFor(() => {
    if (!vmRef.current) throw new Error("ViewModel not captured yet");
    expect(vmRef.current).toBeTruthy();
  });
}

/**
 * Render the consumer with a dedicated Apollo client whose mutations use the
 * default (`errorPolicy: "none"`) behavior — `TestWrapper` globally sets
 * `mutate: { errorPolicy: "all" }`, which resolves (rather than rejects) on
 * failed mutations and would hide the ViewModel's catch-block toasts.
 */
function renderViewModelWithStrictMutations(mocks: MockLink.MockedResponse[]) {
  const client = new ApolloClient({ cache: new InMemoryCache(), link: new MockLink(mocks) });
  render(
    <TestWrapper locale={locale}>
      <ApolloProvider client={client}>
        <ViewModelConsumer />
      </ApolloProvider>
    </TestWrapper>
  );
  return waitFor(() => {
    if (!vmRef.current) throw new Error("ViewModel not captured yet");
    expect(vmRef.current).toBeTruthy();
  });
}

describe("useAppearanceSettingsViewModel — initial state", () => {
  test("exposes labels, presets, draft snapshot, and disabled save state when draft is clean", async () => {
    await renderViewModel([]);
    const vm = vmRef.current;

    expect(vm?.labels.title).toBe(labels.title);
    expect(vm?.draft.colors.light.primaryMain).toBe(DEFAULT_APPEARANCE_DRAFT.colors.light.primaryMain);
    expect(vm?.dirty).toBe(false);
    expect(vm?.saveDraftDisabled).toBe(true);
    expect(vm?.resetDialogOpen).toBe(false);
    expect(vm?.presets.length).toBeGreaterThan(0);
    expect(vm?.presetId).toBe("default");
    expect(vm?.publishedMetaLabel).toBe(labels.lastPublishedBy("administrator", "2 days ago"));
    expect(vm?.draftMetaLabel).toBe(labels.draftUpdatedJustNow);
  });

  test("enables save once the draft becomes dirty via a store edit", async () => {
    await renderViewModel([]);

    act(() => {
      useAppearancePreviewStore.getState().setField("siteName", "Changed Name");
    });

    expect(vmRef.current?.dirty).toBe(true);
    expect(vmRef.current?.saveDraftDisabled).toBe(false);
  });
});

const publishErrorMock = () => ({
  request: { query: publishAppearanceMutationDocument, variables: {} },
  error: new Error("publish failed"),
});

const resetErrorMock = () => ({
  request: { query: resetAppearanceDraftMutationDocument, variables: {} },
  error: new Error("reset failed"),
});

interface MutationScenarioOptions {
  readonly mocks: MockLink.MockedResponse[];
  /** Render through a strict Apollo client so mutation errors reject (error paths). */
  readonly strict?: boolean;
  /** Seed a store edit first so `dirty` is true before invoking the action. */
  readonly makeDirty?: boolean;
  readonly invoke: (vm: AppearanceSettingsViewModel) => Promise<void>;
  readonly expectedMessage: string;
  readonly expectedSeverity: "success" | "error";
}

/**
 * Shared driver for the save/publish/reset mutation scenarios: renders the
 * ViewModel (strict client for error paths so Apollo mutations actually
 * reject), optionally seeds a dirty draft, invokes the handler, and waits
 * for the expected toast.
 */
async function expectMutationNotification(options: MutationScenarioOptions): Promise<void> {
  if (options.strict) {
    await renderViewModelWithStrictMutations(options.mocks);
  } else {
    await renderViewModel(options.mocks);
  }

  if (options.makeDirty) {
    act(() => {
      useAppearancePreviewStore.getState().setField("siteName", "Changed Name");
    });
  }

  await act(async () => {
    const vm = vmRef.current;
    if (vm) await options.invoke(vm);
  });

  await waitFor(() => {
    expect(showNotification).toHaveBeenCalledWith(options.expectedMessage, { severity: options.expectedSeverity });
  });
}

/** Happy + error scenarios for each tab mutation, driven through `test.each`. */
const mutationScenarios: ReadonlyArray<
  Readonly<
    [
      name: string,
      mocks: MockLink.MockedResponse[],
      strict: boolean,
      makeDirty: boolean,
      invoke: (vm: AppearanceSettingsViewModel) => Promise<void>,
      expectedMessage: string,
      expectedSeverity: "success" | "error",
      expectedDirty: boolean,
    ]
  >
> = [
  [
    "save draft — happy path saves, clears dirty flag, shows success toast",
    [saveDraftMock()],
    false,
    true,
    vm => vm.onSaveDraft(),
    labels.saveDraftSuccess,
    "success",
    false,
  ],
  [
    "save draft — error path shows error toast and keeps dirty flag",
    [saveDraftErrorMock()],
    true,
    true,
    vm => vm.onSaveDraft(),
    labels.saveDraftError,
    "error",
    true,
  ],
  [
    "publish — saves the dirty draft first, then publishes, shows success toast",
    [saveDraftMock(), publishMock()],
    false,
    true,
    vm => vm.onPublish(),
    labels.publishSuccess,
    "success",
    false,
  ],
  [
    "publish — error path shows publish error toast",
    [publishErrorMock()],
    true,
    false,
    vm => vm.onPublish(),
    labels.publishError,
    "error",
    false,
  ],
  [
    "reset — error path shows reset error toast",
    [resetErrorMock()],
    true,
    false,
    vm => vm.onResetConfirm(),
    labels.resetError,
    "error",
    false,
  ],
];

describe("useAppearanceSettingsViewModel — mutation flows (test.each)", () => {
  test.each(mutationScenarios)(
    "%s",
    async (_name, mocks, strict, makeDirty, invoke, expectedMessage, expectedSeverity, expectedDirty) => {
      await expectMutationNotification({ mocks, strict, makeDirty, invoke, expectedMessage, expectedSeverity });
      expect(useAppearancePreviewStore.getState().dirty).toBe(expectedDirty);
    }
  );
});

describe("useAppearanceSettingsViewModel — reset flow", () => {
  test("opens and closes the reset dialog via store-backed handlers", async () => {
    await renderViewModel([]);

    expect(vmRef.current?.resetDialogOpen).toBe(false);
    act(() => {
      vmRef.current?.onOpenResetDialog();
    });
    expect(vmRef.current?.resetDialogOpen).toBe(true);
    act(() => {
      vmRef.current?.onCloseResetDialog();
    });
    expect(vmRef.current?.resetDialogOpen).toBe(false);
  });

  test("reset confirm closes dialog, runs reset mutation, marks saved, shows success", async () => {
    await renderViewModel([resetMock()]);

    act(() => {
      useAppearancePreviewStore.getState().setField("siteName", "Changed Name");
      vmRef.current?.onOpenResetDialog();
    });
    expect(vmRef.current?.resetDialogOpen).toBe(true);

    await act(async () => {
      await vmRef.current?.onResetConfirm();
    });

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(labels.resetSuccess, { severity: "success" });
    });
    expect(vmRef.current?.resetDialogOpen).toBe(false);
    expect(useAppearancePreviewStore.getState().dirty).toBe(false);
  });
});

describe("useAppearanceSettingsViewModel — presets and navigation", () => {
  test("apply preset updates the store colors and shows a translated toast", async () => {
    await renderViewModel([]);
    const preset = vmRef.current?.presets[1];
    expect(preset).toBeDefined();
    if (!preset) return;

    act(() => {
      vmRef.current?.onApplyPreset(preset);
    });

    expect(useAppearancePreviewStore.getState().presetId).toBe(preset.id);
    expect(useAppearancePreviewStore.getState().dirty).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(labels.presetApplied(preset.name), { severity: "success" });
  });

  test("enter customize mode pushes the ?customize=1 URL", async () => {
    await renderViewModel([]);

    act(() => {
      vmRef.current?.onEnterCustomizeMode();
    });

    expect(routerPush).toHaveBeenCalled();
    const firstCall = routerPush.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const pushedUrl = firstCall?.[0];
    expect(typeof pushedUrl).toBe("string");
    expect(pushedUrl).toContain("customize=1");
  });
});
