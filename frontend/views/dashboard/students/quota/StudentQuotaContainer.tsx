"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useStudentQuotaStore } from "@/frontend/stores/studentQuotaStore";
import { StudentQuotaView } from "./StudentQuotaView";

export function StudentQuotaContainer() {
  const params = useParams();
  const id = params.id as string;
  const { studentData, isLoading, isSaving, isSaved, fetchStudentData, updateStudentData } = useStudentQuotaStore();

  useEffect(() => {
    if (id) {
      void fetchStudentData(id);
    }
  }, [id, fetchStudentData]);

  return (
    <StudentQuotaView
      studentData={studentData}
      isLoading={isLoading}
      isSaving={isSaving}
      isSaved={isSaved}
      onSave={updateStudentData}
    />
  );
}
