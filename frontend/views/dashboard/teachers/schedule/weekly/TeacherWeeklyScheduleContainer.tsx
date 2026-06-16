"use client";

import { useEffect } from "react";
import { useTeacherScheduleStore } from "@/frontend/stores/teacherScheduleStore";
import { logger } from "@/frontend/utils/logger";
import TeacherWeeklyScheduleView from "./TeacherWeeklyScheduleView";

interface TeacherWeeklyScheduleContainerProps {
  readonly _teacherId: string;
}

export default function TeacherWeeklyScheduleContainer({ _teacherId }: Readonly<TeacherWeeklyScheduleContainerProps>) {
  const { schedule, removeClass } = useTeacherScheduleStore();

  useEffect(() => {
    logger.info(`Loading schedule for teacher: ${_teacherId}`);
  }, [_teacherId]);

  return <TeacherWeeklyScheduleView schedule={schedule} onRemoveClass={removeClass} />;
}
