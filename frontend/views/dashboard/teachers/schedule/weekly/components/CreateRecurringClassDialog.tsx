"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type CreateRecurringClassInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/graphql/sharedDocuments/recurring-class.documents";
import { studentsQueryDocument } from "@/frontend/graphql/sharedDocuments/student.documents";
import { useCreateRecurringClassStore } from "@/frontend/stores/createRecurringClassStore";
import { logger } from "@/frontend/utils/logger";

interface CreateRecurringClassDialogProps {
  readonly teacherId: string;
  readonly onRefetch?: () => void;
}

export function CreateRecurringClassDialog({ teacherId, onRefetch }: Readonly<CreateRecurringClassDialogProps>) {
  const t = useTranslations("dashboard.createRecurringClass");
  const { isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();

  const [studentId, setStudentId] = useState("");
  const [duration, setDuration] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [classType, setClassType] = useState("REGULAR");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: studentsData, loading: loadingStudents } = useQuery(studentsQueryDocument, {
    variables: {
      filterArgs: null,
      paginationArgs: {
        first: 100,
        skip: 0,
        after: null,
        before: null,
        last: null,
        maxCount: null,
        page: null,
      },
      orderBy: null,
    },
    skip: !isDialogOpen,
  });

  const [createClassMutation, { loading: mutationLoading }] = useMutation(createRecurringClassMutationDocument);

  useEffect(() => {
    if (isDialogOpen) {
      setStudentId("");
      setDuration(60);
      setDefaultStartTime("09:00");
      setTimezone("Africa/Cairo");
      setClassType("REGULAR");
      setErrorMsg(null);
      setSuccessMsg(null);
      resetDays();
    }
  }, [isDialogOpen, resetDays]);

  const students = studentsData?.students?.data || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!studentId) {
      setErrorMsg(t("errors.noStudentSelected"));
      return;
    }

    const activeDays = days.filter(d => d.enabled);
    if (activeDays.length === 0) {
      setErrorMsg(t("errors.noDaysSelected"));
      return;
    }

    if (duration <= 0) {
      setErrorMsg("Duration must be greater than 0");
      return;
    }

    try {
      const input: CreateRecurringClassInput = {
        studentId,
        teacherId,
        durationMinutes: Number(duration),
        defaultStartTime,
        timezone,
        classType,
        days: activeDays.map(d => ({
          dayOfWeek: d.day,
          startTime: d.showOverride ? d.timeOverride : defaultStartTime,
          isActive: true,
        })),
        generateInstancesForWeeks: 4,
        effectiveFrom: null,
        effectiveUntil: null,
        timezoneId: null,
      };

      const { data } = await createClassMutation({
        variables: { input },
      });

      if (data?.createRecurringClass) {
        setSuccessMsg(t("success.description", { count: data.createRecurringClass.classInstanceCount ?? 0 }));
        logger.info("Recurring class created successfully", {
          id: data.createRecurringClass.id,
        });

        if (onRefetch) {
          onRefetch();
        }

        // Close after a brief delay to show success
        setTimeout(() => {
          closeDialog();
        }, 2000);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to create recurring class", { err: error });
      setErrorMsg(error.message || t("errors.creationFailed"));
    }
  };

  return (
    <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{t("dialogTitle")}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            {successMsg && <Alert severity="success">{successMsg}</Alert>}

            <FormControl fullWidth>
              <InputLabel id="student-select-label">{t("fields.student")}</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select"
                value={studentId}
                label={t("fields.student")}
                onChange={e => setStudentId(e.target.value)}
                disabled={loadingStudents || mutationLoading}
              >
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id || ""}>
                    {s.name || "Unknown student"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                disabled={mutationLoading}
              />

              <TextField
                fullWidth
                label="Default Start Time"
                type="time"
                value={defaultStartTime}
                onChange={e => setDefaultStartTime(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                disabled={mutationLoading}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="timezone-select-label">{t("fields.timezone")}</InputLabel>
                <Select
                  labelId="timezone-select-label"
                  id="timezone-select"
                  value={timezone}
                  label={t("fields.timezone")}
                  onChange={e => setTimezone(e.target.value)}
                  disabled={mutationLoading}
                >
                  <MenuItem value="Africa/Cairo">Africa/Cairo (Cairo)</MenuItem>
                  <MenuItem value="Asia/Riyadh">Asia/Riyadh (Riyadh)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="class-type-select-label">Class Type</InputLabel>
                <Select
                  labelId="class-type-select-label"
                  id="class-type-select"
                  value={classType}
                  label="Class Type"
                  onChange={e => setClassType(e.target.value)}
                  disabled={mutationLoading}
                >
                  <MenuItem value="REGULAR">Regular</MenuItem>
                  <MenuItem value="TRIAL">Trial</MenuItem>
                  <MenuItem value="ADVANCE">Advance</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {t("fields.days")}
              </Typography>
              <Stack spacing={1}>
                {days.map(d => (
                  <Box
                    key={d.day}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox checked={d.enabled} onChange={() => toggleDay(d.day)} disabled={mutationLoading} />
                      }
                      label={t(`days.${d.day.toLowerCase()}`)}
                    />

                    {d.enabled && (
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={d.showOverride}
                              onChange={() => toggleTimeOverride(d.day)}
                              disabled={mutationLoading}
                            />
                          }
                          label={t("timeOverride.addOverride")}
                        />
                        {d.showOverride && (
                          <TextField
                            size="small"
                            type="time"
                            value={d.timeOverride}
                            onChange={e => setTimeOverride(d.day, e.target.value)}
                            disabled={mutationLoading}
                            slotProps={{
                              inputLabel: {
                                shrink: true,
                              },
                            }}
                          />
                        )}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={mutationLoading}>
            {t("actions.cancel")}
          </Button>
          <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
            <Button type="submit" variant="contained" color="primary" disabled={mutationLoading}>
              {mutationLoading ? "Submitting..." : t("actions.create")}
            </Button>
          </RequirePermission>
        </DialogActions>
      </form>
    </Dialog>
  );
}
