"use client";

import {
  ComputerOutlined,
  LocationOnOutlined,
  MeetingRoomOutlined,
  PersonOutlined,
  ScheduleOutlined,
} from "@mui/icons-material";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PaginationControls, PersonProfileLink, StatusBadge } from "@/frontend/components/ui";
import { profileHrefForTeacher } from "@/frontend/utils/profileHref";
import { ClassSessionActionButton } from "./ClassSessionActionButton";
import type { AcademicClassRow, ClassSessionStatus } from "./types";

interface AcademicScheduleCardListProps {
  readonly rows: readonly AcademicClassRow[];
  readonly totalCount: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: {
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly viewRecording: string;
    readonly active: string;
    readonly upcoming: string;
    readonly missed: string;
    readonly endOfSchedule: string;
  };
  readonly onJoin: (id: string) => void;
  readonly onLeave: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}

function getRoomIcon(room: string) {
  if (room.toLowerCase().includes("lab")) {
    return ComputerOutlined;
  }
  if (room.toLowerCase().includes("room")) {
    return MeetingRoomOutlined;
  }
  return LocationOnOutlined;
}

const AcademicClassCard = ({
  row,
  labels,
  onJoin,
  onLeave,
}: {
  row: AcademicClassRow;
  labels: AcademicScheduleCardListProps["labels"];
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) => {
  const isMissed = row.sessionStatus === "missed";

  const actionLabels = {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    viewRecording: labels.viewRecording,
  };

  const statusLabels: Record<ClassSessionStatus, string> = {
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
  };

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.shadow.card,
        opacity: isMissed ? 0.8 : 1,
        border: "1px solid transparent",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: alpha(theme.palette.header, 0.2),
        },
      })}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography
              variant="titleLg"
              sx={theme => ({
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
                lineHeight: 1.2,
              })}
            >
              {row.className}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
              <PersonOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />
              <PersonProfileLink
                href={profileHrefForTeacher({ teacherId: row.instructorId })}
                name={row.instructor}
                showAvatar={false}
                typographyVariant="bodyMd"
                fontWeight={400}
              />
            </Box>
          </Box>
          <StatusBadge category="classSession" status={row.sessionStatus} label={statusLabels[row.sessionStatus]} />
        </Box>

        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.border.light}`,
            borderBottom: `1px solid ${theme.palette.border.light}`,
            mb: 2,
          })}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <ScheduleOutlined sx={theme => ({ fontSize: 16, color: theme.palette.header })} />
            <Typography variant="labelMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
              {row.time}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box component={getRoomIcon(row.room)} sx={theme => ({ fontSize: 16, color: theme.palette.header })} />
            <Typography variant="labelMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
              {row.room}
            </Typography>
          </Box>
        </Box>

        {isMissed ? (
          <ClassSessionActionButton
            action="view_recording"
            classId={row.id}
            labels={actionLabels}
            onJoin={onJoin}
            onLeave={onLeave}
            fullWidth
          />
        ) : (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <ClassSessionActionButton
              action={row.action === "leave_disabled" ? "leave_disabled" : "leave_enabled"}
              classId={row.id}
              labels={actionLabels}
              onJoin={onJoin}
              onLeave={onLeave}
              fullWidth
            />
            <ClassSessionActionButton
              action="join_session"
              classId={row.id}
              labels={actionLabels}
              onJoin={onJoin}
              onLeave={onLeave}
              fullWidth
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const EndOfSchedule = ({ label }: { label: string }) => {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Box
        sx={theme => ({
          width: "100%",
          height: 192,
          borderRadius: 4,
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.border.light}`,
          mb: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <ScheduleOutlined sx={theme => ({ fontSize: 64, color: theme.palette.text.disabled, opacity: 0.4 })} />
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {label}
      </Typography>
    </Box>
  );
};

export function AcademicScheduleCardList({
  rows,
  totalCount,
  currentPage,
  pageSize,
  labels,
  onJoin,
  onLeave,
  onPageChange,
}: AcademicScheduleCardListProps) {
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <AcademicClassCard key={row.id} row={row} labels={labels} onJoin={onJoin} onLeave={onLeave} />
      ))}
      <EndOfSchedule label={labels.endOfSchedule} />
      {totalCount > 0 && (
        <PaginationControls
          page={currentPage}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </Box>
  );
}
