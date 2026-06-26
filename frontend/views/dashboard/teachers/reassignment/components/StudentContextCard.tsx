"use client";

import { Avatar, Box, Grid, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import type { StudentDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

interface StudentContextCardProps {
  readonly student: StudentDirectoryRow;
}

export function StudentContextCard({ student }: Readonly<StudentContextCardProps>) {
  const t = useTranslations("dashboard.teacherReassignment.studentContext");

  if (!student.id) {
    throw new Error("Student ID is required");
  }

  return (
    <BaseCard>
      <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar
          src={student.avatarUrl || undefined}
          alt={student.name || ""}
          sx={theme => ({
            width: 96,
            height: 96,
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: 3,
          })}
        />
        <Box>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {student.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("studentId", { id: student.id.replace("stu-", "SIR-") })}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Box
              sx={theme => ({
                p: 1.5,
                backgroundColor: theme.palette.surfaceContainerLow,
                borderRadius: 2,
                textAlign: "left",
              })}
            >
              <Typography
                variant="labelUppercase"
                sx={theme => ({
                  color: theme.palette.onSurfaceVariant,
                  fontSize: "10px",
                  display: "block",
                  mb: 0.5,
                })}
              >
                {t("grade")}
              </Typography>
              <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                Year 5
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box
              sx={theme => ({
                p: 1.5,
                backgroundColor: theme.palette.surfaceContainerLow,
                borderRadius: 2,
                textAlign: "left",
              })}
            >
              <Typography
                variant="labelUppercase"
                sx={theme => ({
                  color: theme.palette.onSurfaceVariant,
                  fontSize: "10px",
                  display: "block",
                  mb: 0.5,
                })}
              >
                {t("enrollment")}
              </Typography>
              <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                {t("active")}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </BaseCard>
  );
}
