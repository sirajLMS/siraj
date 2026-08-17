"use client";

import { Box, Typography } from "@mui/material";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ParentQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView";
import { StudentQuotaAudienceView } from "@/frontend/common/views/dashboard/students/quota/audience/StudentQuotaView";
import { SupervisorQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView";
import { TeacherQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export interface QuotaAudienceViewProps {
  readonly t: StudentQuotaLabels;
}

export function QuotaAudienceView({ t }: Readonly<QuotaAudienceViewProps>) {
  const role = useUserStore(s => s.role);

  switch (role) {
    case "STUDENT":
      return <StudentQuotaAudienceView t={t} />;
    case "PARENT":
      return <ParentQuotaView t={t} />;
    case "TEACHER":
      return <TeacherQuotaView t={t} />;
    case "SUPERVISOR":
    case "SUPER_ADMIN":
    case "ACADEMY_ADMIN":
      return <SupervisorQuotaView t={t} />;
    default:
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.audience.noData}
          </Typography>
        </Box>
      );
  }
}
