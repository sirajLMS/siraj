"use client";

import { Button } from "@mui/material";
import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import { Link } from "@/shared/i18n";

interface ProfileCardSharedProps {
  readonly content: ReactNode;
  readonly profileHref: string | undefined;
  readonly buttonId: string;
  readonly viewFullProfileLabel: string;
}

/**
 * Chrome shared by the class-details profile cards: a BaseCard whose top accent
 * is a primary-colored border expressed through theme tokens.
 */
export function ProfileCardShared({
  content,
  profileHref,
  buttonId,
  viewFullProfileLabel,
}: Readonly<ProfileCardSharedProps>) {
  return (
    <BaseCard edgeToEdge sx={theme => ({ borderTop: `4px solid ${theme.palette.primary.main}` })}>
      {content}
      {profileHref ? (
        <Button component={Link} href={profileHref} id={buttonId} variant="outlined" fullWidth>
          {viewFullProfileLabel}
        </Button>
      ) : null}
    </BaseCard>
  );
}
