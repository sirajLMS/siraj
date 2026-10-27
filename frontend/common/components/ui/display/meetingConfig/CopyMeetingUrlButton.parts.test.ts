import { describe, expect, it } from "bun:test";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import {
  CopyMeetingUrlButtonTrigger,
  CopyMeetingUrlIconTrigger,
  CopyMeetingUrlTextTrigger,
} from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.parts";

type ProbeProps = {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly component?: string;
  readonly "aria-disabled"?: boolean;
  readonly disabled?: boolean;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

const mockIcon = createElement("span", { "data-testid": "copy-icon" });
const mockIconColor = () => "rgb(0, 0, 0)";

describe("CopyMeetingUrlButton.parts", () => {
  it("wraps disabled CopyMeetingUrlButtonTrigger in an aria-disabled Box span inside Tooltip", () => {
    const element = expectElement(
      CopyMeetingUrlButtonTrigger({
        size: "small",
        disabled: true,
        onClick: () => {},
        ariaLabel: "Copy link",
        pressed: false,
        tooltipText: "Copy meeting URL",
        icon: mockIcon,
        iconColor: mockIconColor,
        label: "Copy",
      })
    );

    expect(element.props.title).toBe("Copy meeting URL");

    const spanBox = expectElement(element.props.children);
    expect(spanBox.props.component).toBe("span");
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const button = expectElement(spanBox.props.children);
    expect(button.props.disabled).toBe(true);
  });

  it("wraps disabled CopyMeetingUrlIconTrigger in an aria-disabled Box span inside Tooltip", () => {
    const element = expectElement(
      CopyMeetingUrlIconTrigger({
        size: "small",
        disabled: true,
        onClick: () => {},
        ariaLabel: "Copy link",
        pressed: false,
        tooltipText: "Copy meeting URL",
        icon: mockIcon,
        iconColor: mockIconColor,
        label: "Copy",
      })
    );

    expect(element.props.title).toBe("Copy meeting URL");

    const spanBox = expectElement(element.props.children);
    expect(spanBox.props.component).toBe("span");
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const iconButton = expectElement(spanBox.props.children);
    expect(iconButton.props.disabled).toBe(true);
  });

  it("sets aria-disabled on container Box for disabled CopyMeetingUrlTextTrigger", () => {
    const element = expectElement(
      CopyMeetingUrlTextTrigger({
        size: "small",
        disabled: true,
        onClick: () => {},
        ariaLabel: "Copy link",
        pressed: false,
        tooltipText: "Copy meeting URL",
        icon: mockIcon,
        iconColor: mockIconColor,
        label: "Copy",
      })
    );

    expect(element.props.title).toBe("Copy meeting URL");

    const boxContainer = expectElement(element.props.children);
    expect(boxContainer.props["aria-disabled"]).toBe(true);
  });
});
