"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useStudentStatusStore } from "@/frontend/stores/mockStudentStatusStore";
import { StudentStatusView } from "./StudentStatusView";

export function StudentStatusContainer() {
  const params = useParams();
  const id = params.id as string;
  const { studentInfo, isLoading, isUpdating, fetchStudentStatus, updateStatus } = useStudentStatusStore();

  useEffect(() => {
    if (id) {
      void fetchStudentStatus(id);
    }
  }, [id, fetchStudentStatus]);

  return (
    <StudentStatusView
      studentInfo={studentInfo}
      isLoading={isLoading}
      isUpdating={isUpdating}
      onUpdateStatus={updateStatus}
    />
  );
}
