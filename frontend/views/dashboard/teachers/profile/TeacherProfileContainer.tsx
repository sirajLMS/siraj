"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTeacherProfileStore } from "@/frontend/stores/teacherProfileStore";
import { TeacherProfileView } from "./TeacherProfileView";

export function TeacherProfileContainer() {
  const params = useParams();
  const id = params.id as string;
  const { profile, isLoading, isSaving, fetchProfile, updateProfile } = useTeacherProfileStore();

  useEffect(() => {
    if (id) {
      void fetchProfile(id);
    }
  }, [id, fetchProfile]);

  return <TeacherProfileView profile={profile} isLoading={isLoading} isSaving={isSaving} onSave={updateProfile} />;
}
