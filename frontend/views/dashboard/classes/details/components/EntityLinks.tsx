"use client";

import { PersonProfileLink } from "@/frontend/components/ui";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";

interface StudentEntityLinkProps {
  readonly studentId: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly avatarSize?: number;
  readonly showAvatar?: boolean;
  readonly variant?: "titleLg" | "bodyLg";
}

export function StudentEntityLink({
  studentId,
  name,
  avatarUrl,
  avatarSize = 64,
  showAvatar = false,
  variant = "titleLg",
}: StudentEntityLinkProps) {
  return (
    <PersonProfileLink
      href={studentHref(studentId)}
      name={name}
      avatarUrl={avatarUrl}
      showAvatar={showAvatar}
      avatarSize={avatarSize}
      typographyVariant={variant}
      fontWeight={600}
    />
  );
}

interface TeacherEntityLinkProps {
  readonly teacherId?: string | null;
  readonly userId?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly avatarSize?: number;
  readonly showAvatar?: boolean;
  readonly variant?: "titleLg" | "bodyLg";
}

export function TeacherEntityLink({
  teacherId,
  userId,
  name,
  avatarUrl,
  avatarSize = 64,
  showAvatar = false,
  variant = "titleLg",
}: TeacherEntityLinkProps) {
  const href = profileHrefForTeacher({ userId, teacherId });

  return (
    <PersonProfileLink
      href={href}
      name={name}
      avatarUrl={avatarUrl}
      showAvatar={showAvatar}
      avatarSize={avatarSize}
      typographyVariant={variant}
      fontWeight={600}
      emphasizeLink={Boolean(href)}
    />
  );
}
