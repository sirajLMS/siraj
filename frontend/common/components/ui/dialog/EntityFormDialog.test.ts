import { describe, expect, it, spyOn } from "bun:test";
import * as React from "react";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { EntityFormDialog } from "@/frontend/common/components/ui/dialog/EntityFormDialog";

type ProbeProps = {
  readonly children?: ReactNode;
  readonly "aria-labelledby"?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly "aria-busy"?: boolean;
  readonly form?: string;
  readonly open?: boolean;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

spyOn(React, "useId").mockReturnValue(":r0:");

describe("EntityFormDialog", () => {
  it("connects Dialog aria-labelledby to DialogTitle id for screen reader accessibility", () => {
    const dialogElement = expectElement(
      EntityFormDialog({
        open: true,
        title: "Edit Currency",
        formId: "currency-form",
        cancelLabel: "Cancel",
        saveLabel: "Save",
        isLoading: false,
        onClose: () => {},
        children: createElement("form", { id: "currency-form" }),
      })
    );

    const titleId = dialogElement.props["aria-labelledby"];
    expect(titleId).toBe(":r0:");

    const children = Array.isArray(dialogElement.props.children)
      ? dialogElement.props.children
      : [dialogElement.props.children];

    const titleElement = children.find(
      child => isValidElement<ProbeProps>(child) && child.props.id === titleId
    );

    expect(titleElement).toBeDefined();
  });

  it("sets aria-busy and disabled state on buttons during loading", () => {
    const dialogElement = expectElement(
      EntityFormDialog({
        open: true,
        title: "Edit Currency",
        formId: "currency-form",
        cancelLabel: "Cancel",
        saveLabel: "Save",
        isLoading: true,
        onClose: () => {},
        children: createElement("form", { id: "currency-form" }),
      })
    );

    const children = Array.isArray(dialogElement.props.children)
      ? dialogElement.props.children
      : [dialogElement.props.children];

    const actionsElement = children.find(
      child => isValidElement<ProbeProps>(child) && Array.isArray(child.props.children)
    );

    expect(actionsElement).toBeDefined();

    if (isValidElement<ProbeProps>(actionsElement)) {
      const actionButtons = Array.isArray(actionsElement.props.children)
        ? actionsElement.props.children
        : [actionsElement.props.children];

      const saveButton = actionButtons.find(
        btn => isValidElement<ProbeProps>(btn) && btn.props.form === "currency-form"
      );

      expect(saveButton).toBeDefined();
      if (isValidElement<ProbeProps>(saveButton)) {
        expect(saveButton.props.disabled).toBe(true);
        expect(saveButton.props["aria-busy"]).toBe(true);
      }
    }
  });
});
