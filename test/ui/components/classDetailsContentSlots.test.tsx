import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import type { MetricItem } from "@/frontend/common/types/shared.types";
import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type {
  ClassDetailsContentProps,
  ClassDetailsMetricGridSlotProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  buildClassDetailsContentProps,
  ClassDetailsHeaderStub,
} from "@/test/ui/components/fixtures/classDetailsFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);
const session = readTranslation(Translation.Session, locale);

function makeSpyGrid(captured: MetricItem[][], testId: string) {
  return function SpyMetricGrid({ metrics }: ClassDetailsMetricGridSlotProps) {
    captured.push([...metrics]);
    return <div data-testid={testId} />;
  };
}

function renderContent(overrides: Partial<ClassDetailsContentProps>) {
  const teacherCaptured: MetricItem[][] = [];
  const liveCaptured: MetricItem[][] = [];
  const result = renderWithWrapper(
    <ClassDetailsContentShared
      props={buildClassDetailsContentProps(t, session, overrides)}
      slots={{
        Header: ClassDetailsHeaderStub,
        TeacherPerformanceMetricGrid: makeSpyGrid(teacherCaptured, "teacher-metric-grid"),
        LivePerformanceMetricGrid: makeSpyGrid(liveCaptured, "live-metric-grid"),
      }}
    />,
    { locale }
  );
  return { teacherCaptured, liveCaptured, result };
}

describe("ClassDetailsContentShared metric grid slots", () => {
  test("admin view renders the injected live performance grid with MetricItem[]", () => {
    const { teacherCaptured, liveCaptured } = renderContent({ canOverride: true });

    expect(liveCaptured.length).toBeGreaterThan(0);
    expect(liveCaptured[0]?.map(m => m.key)).toEqual(["engagement", "assessment", "focus", "health"]);
    expect(liveCaptured[0]?.map(m => m.count)).toEqual(["92", "60", "High", "Stable"]);
    expect(teacherCaptured).toHaveLength(0);
  });

  test("teacher view renders the injected performance overview grid with MetricItem[]", () => {
    const { teacherCaptured, liveCaptured } = renderContent({ canViewSessionDetails: true });

    expect(teacherCaptured.length).toBeGreaterThan(0);
    expect(teacherCaptured[0]?.map(m => m.key)).toEqual(["attendanceRate", "avgGrade", "lastClass"]);
    expect(teacherCaptured[0]?.map(m => m.count)).toEqual(["85%", "A", `3 ${t.performance.days}`]);
    expect(liveCaptured).toHaveLength(0);
  });

  test("student view renders no performance metric grids", () => {
    const { teacherCaptured, liveCaptured, result } = renderContent({ isStudentView: true });

    expect(teacherCaptured).toHaveLength(0);
    expect(liveCaptured).toHaveLength(0);
    expect(result.queryByTestId("teacher-metric-grid")).toBeNull();
    expect(result.queryByTestId("live-metric-grid")).toBeNull();
    expect(result.queryByText("85%")).toBeNull();
    expect(result.queryByText("92")).toBeNull();
  });
});
