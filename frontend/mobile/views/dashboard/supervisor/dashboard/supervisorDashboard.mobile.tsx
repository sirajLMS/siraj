"use client";

import { CalendarMonthOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";
import { DuesSummaryCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/duesSummaryCard.mobile";
import { PendingReviewsHeroCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.mobile";

export function SupervisorDashboardMobileView({
  userName,
  pendingReviewCount,
  pendingDuesSummary,
  monthlySnapshot,
  recentApprovals,
  labels,
  loading,
  onGoToReviews,
  onGoToDues,
  onGoToMonthlyReports,
  onViewRecentApproval,
}: Readonly<SupervisorDashboardViewModel>) {
  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage(userName ?? "")} />

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        <PendingReviewsHeroCardMobile count={pendingReviewCount} labels={labels} onGoToReviews={onGoToReviews} />

        <DuesSummaryCardMobile summary={pendingDuesSummary} labels={labels} onGoToDues={onGoToDues} />

        <MobileSectionPanel title={labels.monthlyReportsShortcut}>
          <Stack sx={{ gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                {monthlySnapshot.label}
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={onGoToMonthlyReports}
              sx={theme => ({
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: theme.palette.primary.main,
                fontFamily: "inherit",
                fontSize: "inherit",
                textAlign: "start",
              })}
            >
              {labels.goToMonthlyReports}
            </Box>
          </Stack>
        </MobileSectionPanel>

        <MobileSectionPanel title={labels.recentApprovals}>
          <MobileCardList
            rows={recentApprovals}
            loading={loading}
            emptyMessage={labels.noRecentApprovals}
            getKey={item => item.id}
            paginationOptions={false}
            layout="edge-to-edge"
            renderItem={item => (
              <MobileCardListItem variant="edge-to-edge">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onViewRecentApproval(item.id)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "inherit",
                    }}
                    aria-label={labels.recentApprovals}
                  >
                    <CheckCircleOutlined
                      fontSize="small"
                      sx={theme => ({ color: theme.palette.status.activeContainer })}
                    />
                  </Box>
                  <MobilePersonProfileLink
                    href={item.studentId ? studentHref(item.studentId) : undefined}
                    name={item.studentName || item.studentId || "—"}
                    avatarUrl={item.studentAvatarUrl}
                  />
                  <MobilePersonProfileLink
                    href={profileHrefForTeacher({ userId: item.teacherUserId, teacherId: item.teacherId })}
                    name={item.teacherName || item.teacherId || "—"}
                    avatarUrl={item.teacherAvatarUrl}
                  />
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {item.lessonDate}
                  </Typography>
                </Box>
              </MobileCardListItem>
            )}
          />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
