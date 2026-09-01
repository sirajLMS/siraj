import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { avatarInitials } from "@/frontend/common/utils/avatar";
import { ScheduleSessionCardPersonCell } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

afterEach(() => {
  cleanup();
});

const TEACHER_NAME = "Ahmad Hassan";
const STUDENT_NAME = "Sara Ali";
const TEACHER_LABEL = "Teacher";
const PROFILE_HREF = "/teachers/teacher-1/profile";

describe("ScheduleSessionCardPersonCell", () => {
  test("renders name inside a profile link when href is set", () => {
    renderWithWrapper(
      <ScheduleSessionCardPersonCell label={TEACHER_LABEL} name={TEACHER_NAME} tone="teacher" href={PROFILE_HREF} />,
      { locale }
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", PROFILE_HREF);
    expect(link).toHaveTextContent(TEACHER_NAME);
    expect(link).toHaveTextContent(TEACHER_LABEL);
  });

  test("renders plain text without an anchor when href is missing", () => {
    renderWithWrapper(<ScheduleSessionCardPersonCell label={TEACHER_LABEL} name={STUDENT_NAME} tone="student" />, {
      locale,
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(STUDENT_NAME)).toBeInTheDocument();
    expect(screen.getByText(TEACHER_LABEL)).toBeInTheDocument();
  });

  test("shows shared avatar initials when avatarUrl is missing", () => {
    renderWithWrapper(
      <ScheduleSessionCardPersonCell label={TEACHER_LABEL} name={TEACHER_NAME} tone="teacher" href={PROFILE_HREF} />,
      { locale }
    );

    expect(screen.getByText(avatarInitials(TEACHER_NAME))).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  test("renders an avatar image when avatarUrl is set", () => {
    renderWithWrapper(
      <ScheduleSessionCardPersonCell
        label={TEACHER_LABEL}
        name={TEACHER_NAME}
        tone="teacher"
        href={PROFILE_HREF}
        avatarUrl="https://cdn.example.com/avatar.png"
      />,
      { locale }
    );

    expect(screen.getByRole("img", { name: TEACHER_NAME })).toBeInTheDocument();
    expect(screen.queryByText(avatarInitials(TEACHER_NAME))).toBeNull();
  });
});
