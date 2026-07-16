"use client";

import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { SectionPanel } from "@/frontend/common/components/ui";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useAppTranslation } from "@/shared/locale";

interface ProfileAdministrationPanelProps {
  readonly profileUserId: string;
  readonly profileUserName: string;
  readonly profileIsSuperAdmin?: boolean;
}

export function ProfileAdministrationPanel({
  profileUserId,
  profileUserName,
  profileIsSuperAdmin = false,
}: Readonly<ProfileAdministrationPanelProps>) {
  const t = useAppTranslation().authTranslations.impersonation;
  const currentUser = useUserStore(state => state.user);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isSelf = currentUser?.id === profileUserId;

  if (!isSuperAdmin || isSelf || profileIsSuperAdmin) {
    return null;
  }

  return (
    <SectionPanel title={t.administration} sx={{ mt: theme => theme.layout.sectionGap }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2 }}>
        <AdminPanelSettingsOutlined fontSize="small" />
        <ViewAsUserButton targetUserId={profileUserId} targetUserName={profileUserName} variant="button" size="small" />
      </Box>
    </SectionPanel>
  );
}
