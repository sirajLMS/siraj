import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { getStatusColors } from "@/frontend/common/components/ui/badge/statusBadgeShared.utils";
import { createAppTheme } from "@/frontend/common/providers/theme/theme";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { ClassInfoCard } from "@/frontend/common/views/dashboard/classes/details/admin/ClassInfoCard";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.AdminView, locale);

// Matches the TestWrapper defaults (dark theme, RTL for "ar").
const theme = createAppTheme("dark", "rtl", locale);

const labels = { classInfo: t.classInfo, rate: t.rate };

const SUBJECT_ID = "subject-1";
const STUDENT_ID = "student-1";
const TEACHER_ID = "teacher-1";
const STUDENT_NAME = "Layla Hassan";
const TEACHER_NAME = "Omar Farouk";

afterEach(() => {
  cleanup();
});

function renderCard({
  isActive,
  studentId = STUDENT_ID,
  teacherId = TEACHER_ID,
}: {
  readonly isActive: boolean;
  readonly studentId?: string | null;
  readonly teacherId?: string | null;
}) {
  return render(
    <ClassInfoCard
      courseName="Algebra I"
      subjectId={SUBJECT_ID}
      subjectName="Mathematics"
      subjectAvatarUrl={null}
      student={{ id: studentId, name: STUDENT_NAME, avatarUrl: null, grade: null, level: null }}
      teacher={{ id: teacherId, name: TEACHER_NAME, avatarUrl: null, title: "Senior Instructor" }}
      isActive={isActive}
      rateAmount={null}
      rateCurrency={null}
      rateSource={null}
      isRateOverridden={false}
      labels={labels}
    />,
    {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    }
  );
}

function getBadgeElement(text: string): HTMLElement {
  const labelElement = screen.getByText(text);
  const badgeElement = labelElement.parentElement;
  if (!badgeElement) {
    throw new Error("Badge container not found");
  }
  return badgeElement;
}

describe("ClassInfoCard", () => {
  test("shows the live-instance status badge only when the instance is active", () => {
    renderCard({ isActive: true });

    const badgeElement = getBadgeElement(labels.classInfo.liveInstance);
    const expected = getStatusColors(theme, "classInstance", "ACTIVATED");
    const computed = getComputedStyle(badgeElement);
    expect(computed.backgroundColor).toBe(expected.backgroundColor);
    expect(computed.color).toBe(expected.color);
  });

  test("hides the live-instance badge and active-connection indicator when not active", () => {
    renderCard({ isActive: false });

    expect(screen.queryByText(labels.classInfo.liveInstance)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.classInfo.activeConnection)).not.toBeInTheDocument();
  });

  test("student and teacher profile links keep their hrefs", () => {
    const { container } = renderCard({ isActive: true });

    const studentLink = container.querySelector(`a[href="${studentHref(STUDENT_ID)}"]`);
    expect(studentLink).not.toBeNull();
    expect(studentLink?.textContent).toContain(STUDENT_NAME);

    const teacherLink = container.querySelector(`a[href="${profileHrefForTeacher({ teacherId: TEACHER_ID })}"]`);
    expect(teacherLink).not.toBeNull();
    expect(teacherLink?.textContent).toContain(TEACHER_NAME);
  });

  test("renders names as plain text when no profile href exists", () => {
    renderCard({ isActive: false, studentId: null, teacherId: null });

    expect(screen.getByText(STUDENT_NAME).closest("a")).toBeNull();
    expect(screen.getByText(TEACHER_NAME).closest("a")).toBeNull();
  });

  test("subject avatar keeps linking to the subject page", () => {
    const { container } = renderCard({ isActive: false });

    const subjectLinks = container.querySelectorAll(`a[href="/subjects/${SUBJECT_ID}"]`);
    // One link wraps the avatar, another wraps the "view subject" button.
    expect(subjectLinks.length).toBeGreaterThanOrEqual(2);
  });
});
