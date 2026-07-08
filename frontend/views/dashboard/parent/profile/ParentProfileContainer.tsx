"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentAssociatedStudentsQueryDocument, parentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import type { ParentProfileData, ParentStudent } from "../types/profile";
import ParentProfileView from "./ParentProfileView";

interface ParentProfileContainerProps {
  readonly id: string;
}

type ParentAccountStatus = ParentProfileData["status"];

function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function mapStudent(raw: {
  readonly id: string | null | undefined;
  readonly name: string | null | undefined;
  readonly teacherName: string | null | undefined;
  readonly hoursPerWeek: string | null | undefined;
  readonly classesRemaining: number | null | undefined;
  readonly classesTotal: number | null | undefined;
  readonly language: string | null | undefined;
  readonly gender: string | null | undefined;
  readonly status: string | null | undefined;
}): ParentStudent | null {
  if (!isNonEmpty(raw.id) || !isNonEmpty(raw.name)) return null;
  return {
    id: raw.id,
    name: raw.name,
    teacher: raw.teacherName ?? "",
    hoursPerWeek: Number(raw.hoursPerWeek ?? 0),
    classesLeft: raw.classesRemaining ?? 0,
    totalClasses: raw.classesTotal ?? 0,
    language: raw.language ?? "",
    gender: (raw.gender?.toLowerCase() ?? "male") as ParentStudent["gender"],
    status: (raw.status?.toLowerCase() ?? "regular") as ParentStudent["status"],
  };
}

function mapProfileData(
  profile: {
    readonly id: string | null;
    readonly userId: string | null;
    readonly name: string | null;
    readonly email: string | null;
    readonly avatarUrl: string | null;
    readonly status: string | null;
    readonly phone: string | null;
    readonly nationality: string | null;
    readonly address: string | null;
    readonly facebook: string | null;
    readonly whatsapp: string | null;
    readonly defaultZoomLink: string | null;
    readonly invoiceType: string | null;
    readonly feeAmount: string | null;
    readonly paymentMethod: string | null;
    readonly currency: string | null;
  },
  associatedStudents: ReadonlyArray<{
    readonly id: string | null;
    readonly name: string | null;
    readonly teacherName: string | null;
    readonly hoursPerWeek: string | null;
    readonly classesRemaining: number | null;
    readonly classesTotal: number | null;
    readonly language: string | null;
    readonly gender: string | null;
    readonly status: string | null;
  }>
): ParentProfileData | null {
  if (!isNonEmpty(profile.id) || !isNonEmpty(profile.name) || !isNonEmpty(profile.email)) {
    return null;
  }

  const students: ParentStudent[] = [];
  for (const raw of associatedStudents) {
    const mapped = mapStudent(raw);
    if (mapped) students.push(mapped);
  }

  return {
    id: profile.id,
    userId: profile.userId ?? "",
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl ?? undefined,
    status: (profile.status?.toLowerCase() ?? "regular") as ParentAccountStatus,
    nationality: profile.nationality ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    facebook: profile.facebook ?? undefined,
    whatsapp: profile.whatsapp ?? undefined,
    zoomLink: profile.defaultZoomLink ?? undefined,
    invoiceType: profile.invoiceType ?? "",
    feeAmount: profile.feeAmount ? Number(profile.feeAmount) : 0,
    paymentMethod: profile.paymentMethod ?? "",
    currency: profile.currency ?? "",
    students,
  };
}

export function ParentProfileContainer({ id }: ParentProfileContainerProps) {
  const t = useTranslations("dashboard.parentProfile");
  const tc = useTranslations("common");
  const parentId = id;

  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
  } = useQuery(parentProfileQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const {
    data: studentsData,
    loading: studentsLoading,
    refetch: refetchStudents,
  } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  if (!parentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (profileLoading || studentsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileError || !profileData?.parentProfile) {
    logger.error("Error loading parent profile:", { profileError });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  const parentData = mapProfileData(profileData.parentProfile, studentsData?.parentAssociatedStudents ?? []);

  if (!parentData) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidData")}</Typography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ParentViewProfile]}>
      <ParentProfileView parent={parentData} parentId={parentId} onRefetchStudents={() => void refetchStudents()} />
    </RequirePermission>
  );
}

export default ParentProfileContainer;
