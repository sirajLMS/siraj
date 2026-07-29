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
      router.replace(buildTeacherProfileEditHref(false, searchParams.toString()));
    }
  }, [active, nationalIdComplete, router, searchParams]);

  return null;
}
