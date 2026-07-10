"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
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
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import {
  AppPermission,
  ClassType as ClassTypeEnum,
  type CreateRecurringClassInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { studentsQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student.documents";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { useCreateRecurringClassStore } from "@/frontend/stores/createRecurringClassStore";
import { logger } from "@/frontend/utils/logger";
import { RecurringMeetingConfigSection } from "@/frontend/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import { CLASS_TYPE_OPTIONS } from "@/frontend/views/dashboard/classes/recurring/types";
import {
  emptyRecurringMeetingConfigState,
  postCreateRecurringMeetingConfig,
  type RecurringMeetingConfigFormState,
} from "@/frontend/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  isRecurringMeetingConfigValid,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import type { CreateRecurringClassDialogProps } from "@/frontend/views/dashboard/teachers/schedule/weekly/types";

export function CreateRecurringClassDialog({ teacherId, onRefetch }: Readonly<CreateRecurringClassDialogProps>) {
  const t = useTranslations("dashboard.teacherCreateRecurringClass");
  const tMeeting = useTranslations("ui.meetingConfig.manager");
  const tClassScope = useTranslations("ui.meetingConfig.classScope");
  const notifications = useNotifications();
  const client = useApolloClient();
  const { isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();

  const [studentId, setStudentId] = useState("");
  const [duration, setDuration] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [classType, setClassType] = useState<ClassTypeEnum>(ClassTypeEnum.Regular);
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(emptyRecurringMeetingConfigState);

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
      setClassType(ClassTypeEnum.Regular);
      setMeetingConfig(emptyRecurringMeetingConfigState());
      resetDays();
    }
  }, [isDialogOpen, resetDays]);

  const students = studentsData?.students?.data || [];

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!studentId) {
      notifications.show(t("errors.noStudentSelected"), { severity: "error" });
      return;
    }

    const activeDays = days.filter(d => d.enabled);
    if (activeDays.length === 0) {
      notifications.show(t("errors.noDaysSelected"), { severity: "error" });
      return;
    }

    if (duration <= 0) {
      notifications.show(t("errors.durationMustBePositive"), { severity: "error" });
      return;
    }

    if (!isRecurringMeetingConfigValid(meetingConfig)) {
      const errorKey = getRecurringMeetingConfigErrorKey(meetingConfig);
      const message = resolveRecurringMeetingConfigErrorMessage(errorKey, {
        recurringFieldsRequired: tClassScope("recurringFieldsRequired"),
        urlNotAllowed: tMeeting("urlNotAllowed"),
      });
      notifications.show(message ?? tMeeting("urlNotAllowed"), { severity: "error" });
      return;
    }

    try {
      const input: CreateRecurringClassInput = {
        studentId,
        teacherId,
        durationMinutes: Number(duration),
        defaultStartTime,
        timezone: toGraphqlIanaTimezone(timezone),
        classType,
        days: activeDays.map(d => ({
          dayOfWeek: d.day,
          startTime: d.showOverride ? d.timeOverride : defaultStartTime,
          isActive: true,
        })),
        generateInstancesForWeeks: 4,
        effectiveFrom: null,
        effectiveUntil: null,
      };

      const { data } = await createClassMutation({
        variables: { input },
      });

      if (data?.createRecurringClass) {
        const recurringScheduleId = data.createRecurringClass.recurringScheduleId;
        if (recurringScheduleId) {
          const meetingResult = await postCreateRecurringMeetingConfig(client, recurringScheduleId, meetingConfig);
          if (!meetingResult.success) {
            notifications.show(tMeeting("postCreateFailure"), { severity: "warning" });
          }
        }

        notifications.show(t("success.description", { count: data.createRecurringClass.classInstanceCount ?? 0 }), {
          severity: "success",
        });
        logger.info("Recurring class created successfully", {
          id: data.createRecurringClass.id,
        });

        if (onRefetch) {
          onRefetch();
        }

        closeDialog();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to create recurring class", { err: error });
      notifications.show(t("errors.creationFailed"), { severity: "error" });
    }
  };

  return (
    <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{t("dialogTitle")}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
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
                label={t("fields.durationMinutes")}
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                disabled={mutationLoading}
              />

              <TextField
                fullWidth
                label={t("fields.time")}
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
              <Box sx={{ flex: 1 }}>
                <TimezoneSelect
                  value={toGraphqlIanaTimezone(timezone)}
                  onChangeAction={value => {
                    setTimezone(value ? fromGraphqlIanaTimezone(value) : "");
                  }}
                  label={t("fields.timezone")}
                  fullWidth
                  disabled={mutationLoading}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel id="class-type-select-label">{t("fields.classType")}</InputLabel>
                <Select
                  labelId="class-type-select-label"
                  id="class-type-select"
                  value={classType}
                  label={t("fields.classType")}
                  onChange={e => setClassType(e.target.value)}
                  disabled={mutationLoading}
                >
                  {CLASS_TYPE_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      {t(`classTypes.${opt}`)}
                    </MenuItem>
                  ))}
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

            <RecurringMeetingConfigSection
              teacherId={teacherId}
              value={meetingConfig}
              onChangeAction={setMeetingConfig}
              disabled={mutationLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={mutationLoading}>
            {t("actions.cancel")}
          </Button>
          <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
            <Button type="submit" variant="contained" color="primary" disabled={mutationLoading}>
              {mutationLoading ? t("actions.submitting") : t("actions.create")}
            </Button>
          </RequirePermission>
        </DialogActions>
      </form>
    </Dialog>
  );
}
