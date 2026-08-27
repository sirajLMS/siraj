import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { useEnvironmentConfigSettingsStore } from "@/frontend/common/stores/environmentConfigSettingsStore";
import { EnvSecretField } from "@/frontend/common/views/dashboard/settings/components/environment/EnvSecretField";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useEnvironmentConfigSettingsStore.setState({ revealedKeys: {} });
});

function renderField(props: Partial<React.ComponentProps<typeof EnvSecretField>> = {}) {
  const defaultProps = {
    configKey: "TEST_SECRET_KEY",
    label: "Test Secret",
    value: "super-secret-123",
    isSecret: true,
    showValueLabel: "Show secret value",
    hideValueLabel: "Hide secret value",
    ...props,
  };

  return render(<EnvSecretField {...defaultProps} />, {
    wrapper: ({ children }) => <TestWrapper locale="en">{children}</TestWrapper>,
  });
}

describe("EnvSecretField", () => {
  test("renders plain TextField when isSecret is false", () => {
    renderField({ isSecret: false, value: "public-value" });
    expect(screen.getByLabelText("Test Secret")).toBeInTheDocument();
    expect(screen.getByDisplayValue("public-value")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("renders secret field with tooltip and toggle icon button when isSecret is true", () => {
    renderField({ isSecret: true });

    // Toggle button should be present with aria-label = showValueLabel initially
    const toggleButton = screen.getByLabelText("Show secret value");
    expect(toggleButton).toBeInTheDocument();

    // Field should initially be type password
    const input = screen.getByLabelText("Test Secret");
    expect(input).toHaveAttribute("type", "password");
  });

  test("toggles visibility state and updates tooltip label when clicked", () => {
    renderField({ isSecret: true });

    const toggleButton = screen.getByLabelText("Show secret value");
    fireEvent.click(toggleButton);

    // After clicking, the button should have aria-label = hideValueLabel
    expect(screen.getByLabelText("Hide secret value")).toBeInTheDocument();

    // Input type should change to text
    const input = screen.getByLabelText("Test Secret");
    expect(input).toHaveAttribute("type", "text");
  });

  test("renders readOnly secret field with placeholder and toggle button tooltip", () => {
    renderField({ configKey: "READONLY_KEY", isSecret: true, readOnly: true, value: "secret-data" });

    // In readOnly mode when not revealed, display value is hidden placeholder
    expect(screen.getByDisplayValue("••••••••")).toBeInTheDocument();

    const toggleButton = screen.getByLabelText("Show secret value");
    expect(toggleButton).toBeInTheDocument();
  });
});
