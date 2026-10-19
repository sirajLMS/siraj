import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";

function handleJoinLesson(upcomingLessons: readonly UpcomingLessonRow[], id: string): void {
  const lesson = upcomingLessons.find(l => l.id === id);
  const url = lesson?.meetingJoinUrl;
  if (url) {
    safeOpenWindow(url);
  }
}

describe("handleJoinLesson - meeting URL security", () => {
  let openSpy: ReturnType<typeof mock>;
  let hadRealWindow = false;
  let originalOpen: typeof window.open | undefined;

  beforeEach(() => {
    openSpy = mock(() => null);
    hadRealWindow = typeof globalThis.window !== "undefined";
    if (hadRealWindow) {
      originalOpen = globalThis.window.open;
    } else {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
    globalThis.window.open = openSpy;
  });

  afterEach(() => {
    if (hadRealWindow && originalOpen) {
      globalThis.window.open = originalOpen;
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("opens window for valid https meeting URL", () => {
    const upcomingLessons: UpcomingLessonRow[] = [
      {
        id: "lesson-1",
        subjectName: "Math",
        teacherName: "John Doe",
        startAtIso: "2026-03-30T10:00:00Z",
        durationMinutes: 60,
        meetingJoinUrl: "https://zoom.us/j/123456789",
      },
    ];

    handleJoinLesson(upcomingLessons, "lesson-1");

    expect(openSpy).toHaveBeenCalledWith("https://zoom.us/j/123456789", "_blank", "noopener,noreferrer");
  });

  test("blocks window opening for malicious javascript: meeting URL", () => {
    const upcomingLessons: UpcomingLessonRow[] = [
      {
        id: "lesson-2",
        subjectName: "Math",
        teacherName: "John Doe",
        startAtIso: "2026-03-30T10:00:00Z",
        durationMinutes: 60,
        meetingJoinUrl: "javascript:alert('XSS')",
      },
    ];

    handleJoinLesson(upcomingLessons, "lesson-2");

    expect(openSpy).not.toHaveBeenCalled();
  });
});
