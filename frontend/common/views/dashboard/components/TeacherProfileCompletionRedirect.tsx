"use client";

import { useEffect } from "react";
import {
  isTeacherProfileCompletionPath,
  TEACHER_PROFILE_COMPLETION_EDIT_HREF,
} from "@/frontend/common/lib/profileCompletion";
import { stripLocaleFromPath } from "@/frontend/common/views/dashboard/lib/stripLocaleFromPath";
import { usePathname, useRouter } from "@/shared/i18n/navigation";

interface TeacherProfileCompletionRedirectProps {
  readonly active: boolean;
}

/**
 * Client-side guard for teachers with incomplete required profile fields.
 * Complements the server redirect in {@link DashboardProfileShell} on SPA navigations.
 */
export function TeacherProfileCompletionRedirect({ active }: Readonly<TeacherProfileCompletionRedirectProps>) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }
    const normalizedPath = stripLocaleFromPath(pathname);
    if (!isTeacherProfileCompletionPath(normalizedPath)) {
      router.replace(TEACHER_PROFILE_COMPLETION_EDIT_HREF);
    }
  }, [active, pathname, router]);

  return null;
}
