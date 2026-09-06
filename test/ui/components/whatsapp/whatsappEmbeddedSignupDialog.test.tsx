import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  EmbeddedSignupDialog,
  type FbLoginResponse,
  type FbSdkApi,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

/** Installs a stub FB SDK whose login immediately resolves with a code. */
function installFbStub(response: FbLoginResponse): { login: ReturnType<typeof mock> } {
  const login = mock((callback: (res: FbLoginResponse) => void) => {
    callback(response);
  });
  const fb: FbSdkApi = { init: () => {}, login };
  window.FB = fb;
  return { login };
}

function removeFb() {
  delete (window as { FB?: unknown }).FB;
}

function dispatchSessionEvent(payload: Record<string, unknown>) {
  // Meta posts session events from the facebook.com origin; the hook drops
  // messages from any other origin.
  fireEvent(window, new MessageEvent("message", { data: payload, origin: "https://www.facebook.com" }));
}

function renderDialog(overrides: Record<string, unknown> = {}) {
  const onComplete = mock(async (_payload: unknown): Promise<void> => {});
  const onClose = mock(() => {});
  renderWithWrapper(
    <EmbeddedSignupDialog
      open
      fullScreen={false}
      labels={labels}
      configId="cfg_test_1"
      appId="app_test_1"
      onComplete={onComplete}
      onClose={onClose}
      {...overrides}
    />,
    { locale }
  );
  return { onComplete, onClose };
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  removeFb();
  cleanup();
});

describe("EmbeddedSignupDialog", () => {
  test("shows the launch surface when configured", () => {
    renderDialog();
    expect(screen.getByText(labels.embeddedSignupTitle)).toBeTruthy();
    expect(screen.getByText(labels.embeddedSignupDescription)).toBeTruthy();
    expect(screen.getByRole("button", { name: labels.embeddedSignupLaunch })).toBeTruthy();
  });

  test("shows stepper steps, version note, and background-sync info", () => {
    renderDialog();
    // Step 1 label coincides with the launch button label.
    expect(screen.getAllByText(labels.embeddedSignupLaunch)).toHaveLength(2);
    expect(screen.getByText(labels.embeddedSignupStepCompleteInApp)).toBeTruthy();
    expect(screen.getByText(labels.embeddedSignupStepSync)).toBeTruthy();
    expect(screen.getByText(labels.embeddedSignupVersionNote)).toBeTruthy();
    expect(screen.getByText(labels.embeddedSignupSyncInfo)).toBeTruthy();
  });

  test("header close icon closes the dialog", () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupClose }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("shows not-configured copy and no launch button when config id is missing", () => {
    renderDialog({ configId: null });
    expect(screen.getByText(labels.embeddedSignupNotConfigured)).toBeTruthy();
    expect(screen.queryByRole("button", { name: labels.embeddedSignupLaunch })).toBeNull();
  });

  test("launches FB.login with the server config id and completes on FINISH + code", async () => {
    installFbStub({ authResponse: { code: "code_test_a" }, status: "connected" });
    const { onComplete } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
    });

    expect(window.FB?.login).toBeDefined();

    await act(async () => {
      dispatchSessionEvent({
        type: "WA_EMBEDDED_SIGNUP",
        event: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
        data: { phone_number_id: "105", waba_id: "10001", business_id: "20002" },
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(onComplete).toHaveBeenCalledWith({
      code: "code_test_a",
      wabaId: "10001",
      phoneNumberId: "105",
      businessId: "20002",
    });
    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupSuccessTitle)).toBeTruthy();
    });
  });

  test("success surface offers a Done action that closes the dialog", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    const { onClose } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({
        type: "WA_EMBEDDED_SIGNUP",
        event: "FINISH",
        data: { phone_number_id: "105", waba_id: "10001" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupSuccessTitle)).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupDone }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("only-waba_id finish event completes without a phoneNumberId", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    const { onComplete } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({
        type: "WA_EMBEDDED_SIGNUP",
        event: "FINISH_ONLY_WABA",
        data: { waba_id: "10001" },
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        code: "code_test_a",
        wabaId: "10001",
        phoneNumberId: undefined,
        businessId: undefined,
      });
    });
  });

  test("CANCEL session event shows the declined error panel with retry", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    const { onComplete } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL", current_step: "VERIFY_NUMBER" });
    });

    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupCancelledTitle)).toBeTruthy();
    });
    expect(screen.getByText(labels.embeddedSignupCancelledBody)).toBeTruthy();
    expect(screen.getByRole("button", { name: labels.embeddedSignupRetry })).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("retry from the declined panel restarts the flow at the launch step", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL" });
    });
    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupCancelledTitle)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupRetry }));
    });

    expect(screen.getByRole("button", { name: labels.embeddedSignupLaunch })).toBeTruthy();
    expect(screen.getByText(labels.embeddedSignupDescription)).toBeTruthy();
  });

  test("ERROR session event shows the error panel with the localized error body", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({ type: "WA_EMBEDDED_SIGNUP", event: "ERROR", error_message: "boom" });
    });

    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupErrorTitle)).toBeTruthy();
    });
    expect(screen.getByText(labels.embeddedSignupErrorBody)).toBeTruthy();
    const alertPanel = screen.getByRole("alert");
    expect(alertPanel.className.includes("MuiAlert-colorError")).toBe(true);
  });

  test("popup closed without a code lands on the cancelled surface", async () => {
    installFbStub({ authResponse: null, status: "unknown" });
    const { onComplete } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
    });

    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupCancelledTitle)).toBeTruthy();
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("completion rejection shows the error surface", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    const { onComplete } = renderDialog();
    onComplete.mockRejectedValueOnce(new Error("mutation failed"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      dispatchSessionEvent({
        type: "WA_EMBEDDED_SIGNUP",
        event: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
        data: { phone_number_id: "105", waba_id: "10001" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(labels.embeddedSignupErrorTitle)).toBeTruthy();
    });
  });

  test("ignores unrelated foreign window messages", async () => {
    installFbStub({ authResponse: { code: "code_test_a" } });
    const { onComplete } = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.embeddedSignupLaunch }));
      fireEvent(window, new MessageEvent("message", { data: { type: "OTHER_EVENT" } }));
      fireEvent(window, new MessageEvent("message", { data: "not-json" }));
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(labels.embeddedSignupWaitingTitle)).toBeTruthy();
  });
});
