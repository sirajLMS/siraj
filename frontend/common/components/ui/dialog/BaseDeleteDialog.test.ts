import { describe, expect, it, spyOn } from "bun:test";
import * as React from "react";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import { BaseDeleteDialogScaffold } from "@/frontend/common/components/ui/dialog/baseDeleteDialogShared";

type ProbeProps = {
  readonly children?: ReactNode;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly "aria-busy"?: boolean;
  readonly open?: boolean;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

spyOn(React, "useId").mockReturnValue(":r0:");

describe("BaseDeleteDialogScaffold", () => {
  it("connects Dialog aria-labelledby and aria-describedby when dialogId is omitted", () => {
    const dialogElement = expectElement(
      BaseDeleteDialogScaffold({
        open: true,
        isLoading: false,
        title: "Delete Payment Method",
        body: "Are you sure you want to delete this payment method?",
        cancelLabel: "Cancel",
        confirmLabel: "Delete",
        onClose: () => {},
        onConfirm: () => {},
        CancelActionButton: FilterButton,
        ConfirmActionButton: PrimaryPageAction,
      })
    );

    const titleId = dialogElement.props["aria-labelledby"];
    const descriptionId = dialogElement.props["aria-describedby"];

    expect(titleId).toBe(":r0:");
    expect(descriptionId).toBe(":r0:-description");
    if (!descriptionId) throw new Error("descriptionId must be defined");

    const children = Array.isArray(dialogElement.props.children)
      ? dialogElement.props.children
      : [dialogElement.props.children];

    const titleElement = children.find(child => isValidElement<ProbeProps>(child) && child.props.id === titleId);
    expect(titleElement).toBeDefined();

    // Find the body element with id === descriptionId across all dialog children
    const findElementById = (nodes: ReactNode, targetId: string): ReactElement<ProbeProps> | undefined => {
      if (!nodes) return undefined;
      const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
      for (const node of nodeArray) {
        if (isValidElement<ProbeProps>(node)) {
          if (node.props.id === targetId) return node;
          if (node.props.children) {
            const found = findElementById(node.props.children, targetId);
            if (found) return found;
          }
        }
      }
      return undefined;
    };

    const bodyElement = findElementById(dialogElement.props.children, descriptionId);
    expect(bodyElement).toBeDefined();
  });

  it("respects explicitly provided dialogId for aria-labelledby and aria-describedby", () => {
    const customDialogId = "custom-delete-dialog-id";
    const dialogElement = expectElement(
      BaseDeleteDialogScaffold({
        open: true,
        isLoading: false,
        dialogId: customDialogId,
        title: "Delete Category",
        body: "Are you sure you want to delete this category?",
        cancelLabel: "Cancel",
        confirmLabel: "Delete",
        onClose: () => {},
        onConfirm: () => {},
        CancelActionButton: FilterButton,
        ConfirmActionButton: PrimaryPageAction,
      })
    );

    expect(dialogElement.props["aria-labelledby"]).toBe(customDialogId);
    expect(dialogElement.props["aria-describedby"]).toBe(`${customDialogId}-description`);
  });
});
