"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { buildTeacherProfileEditHref, hasForceCompleteSearchParam } from "@/frontend/common/lib/profileCompletion";
import { useRouter } from "@/shared/i18n/navigation";

interface TeacherProfileEditForceCompleteGuardProps {
  readonly active: boolean;
  readonly nationalIdComplete: boolean;
}

/**
 * Client-side guard for teacher own-profile edit force-complete query param.
 * Complements the server redirect in `app/(dashboard)/profile/edit/page.tsx` on SPA navigations.
 *
 * Behavior:
 *  - Missing national ID without forceComplete: push the force-complete URL back.
 *  - National ID completed while forceComplete is set: the teacher has just
 *    finished the required profile completion flow, so redirect to /dashboard
 *    (their original destination) rather than back to the regular edit page.
 */
export function TeacherProfileEditForceCompleteGuard({
  active,
  nationalIdComplete,
}: Readonly<TeacherProfileEditForceCompleteGuardProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!active) {
      return;
    }

    const forceComplete = hasForceCompleteSearchParam(searchParams);

    if (!nationalIdComplete && !forceComplete) {
      router.replace(buildTeacherProfileEditHref(true, searchParams.toString()));
      return;
    }

    if (nationalIdComplete && forceComplete) {
      router.replace("/dashboard");
    }
  }, [active, nationalIdComplete, router, searchParams]);

  return null;
}
