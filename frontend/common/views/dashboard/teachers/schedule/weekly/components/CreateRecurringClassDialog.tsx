"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
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
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import {
  AppPermission,
  ClassType as ClassTypeEnum,
  type CreateRecurringClassInput,
  type DayOfWeek,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { studentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { logger } from "@/frontend/common/utils/logger";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import { CLASS_TYPE_OPTIONS, type DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  emptyRecurringMeetingConfigState,
  postCreateRecurringMeetingConfig,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  isRecurringMeetingConfigValid,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import type { CreateRecurringClassDialogProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale/types/ui";

function buildCreateRecurringClassInput(
  studentId: string,
  teacherId: string,
  duration: number,
  defaultStartTime: string,
  timezone: string,
  classType: ClassTypeEnum,
  days: readonly DayScheduleConfig[]
): CreateRecurringClassInput {
  const activeDays = days.filter(d => d.enabled);
  return {
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
}

function useDialogFormState(isDialogOpen: boolean, resetDays: () => void) {
  const [studentId, setStudentId] = useState("");
  const [duration, setDuration] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [classType, setClassType] = useState<ClassTypeEnum>(ClassTypeEnum.Regular);
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(emptyRecurringMeetingConfigState);
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (isDialogOpen) {
      setStudentId("");
      setDuration(60);
      setDefaultStartTime("09:00");
      setTimezone("Africa/Cairo");
      setClassType(ClassTypeEnum.Regular);
      setMeetingConfig(emptyRecurringMeetingConfigState());
      setMeetingConfigWarning(false);
      setCreatedClassInstanceId(null);
      resetDays();
    }
  }, [isDialogOpen, resetDays]);

  return {
    studentId,
    setStudentId,
    duration,
    setDuration,
    defaultStartTime,
    setDefaultStartTime,
    timezone,
    setTimezone,
    classType,
    setClassType,
    meetingConfig,
    setMeetingConfig,
    meetingConfigWarning,
    setMeetingConfigWarning,
    createdClassInstanceId,
    setCreatedClassInstanceId,
  };
}

function useValidation(
  state: ReturnType<typeof useDialogFormState>,
  days: readonly DayScheduleConfig[],
  notifications: ReturnType<typeof useNotifications>,
  t: TeacherCreateRecurringClassLabels,
  tClassScope: MeetingConfigClassScopeLabels,
  tMeeting: MeetingConfigManagerLabels
) {
  return useCallback((): boolean => {
    if (!state.studentId) {
      notifications.show(t.errors.noStudentSelected, { severity: "error" });
      return false;
    }

    const activeDays = days.filter(d => d.enabled);
    if (activeDays.length === 0) {
      notifications.show(t.errors.noDaysSelected, { severity: "error" });
      return false;
    }

    if (state.duration <= 0) {
      notifications.show(t.errors.durationMustBePositive, { severity: "error" });
      return false;
    }

    if (!isRecurringMeetingConfigValid(state.meetingConfig)) {
      const errorKey = getRecurringMeetingConfigErrorKey(state.meetingConfig);
      const message = resolveRecurringMeetingConfigErrorMessage(errorKey, {
        recurringFieldsRequired: tClassScope.recurringFieldsRequired,
        urlNotAllowed: tMeeting.urlNotAllowed,
      });
      notifications.show(message ?? tMeeting.urlNotAllowed, { severity: "error" });
      return false;
    }

    return true;
  }, [state.studentId, state.duration, state.meetingConfig, days, notifications, t, tClassScope, tMeeting]);
}

function MeetingConfigWarningAlert({
  createdClassInstanceId,
  tMeeting,
  tRecurringSchedule,
  router,
}: {
  readonly createdClassInstanceId: string | null;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly router: ReturnType<typeof useRouter>;
}) {
  return (
    <Alert
      severity="warning"
      action={
        createdClassInstanceId ? (
          <Button color="inherit" size="small" onClick={() => router.push(`/classes/${createdClassInstanceId}`)}>
            {tRecurringSchedule.goToClass}
          </Button>
        ) : undefined
      }
    >
      {tMeeting.postCreateFailure}
    </Alert>
  );
}

function StudentSelectField({
  studentId,
  setStudentId,
  students,
  loadingStudents,
  mutationLoading,
  t,
}: {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly students: readonly { readonly id: string; readonly name: string }[];
  readonly loadingStudents: boolean;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="student-select-label">{t.fields.student}</InputLabel>
      <Select
        labelId="student-select-label"
        id="student-select"
        value={studentId}
        label={t.fields.student}
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
  );
}

function DurationTimeFields({
  duration,
  setDuration,
  defaultStartTime,
  setDefaultStartTime,
  mutationLoading,
  t,
}: {
  readonly duration: number;
  readonly setDuration: (value: number) => void;
  readonly defaultStartTime: string;
  readonly setDefaultStartTime: (value: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        fullWidth
        label={t.fields.duration}
        type="number"
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label={t.fields.time}
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
  );
}

function TimezoneClassTypeFields({
  timezone,
  setTimezone,
  classType,
  setClassType,
  mutationLoading,
  t,
}: {
  readonly timezone: string;
  readonly setTimezone: (value: string) => void;
  readonly classType: ClassTypeEnum;
  readonly setClassType: (value: ClassTypeEnum) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  const classTypeLabels: Record<string, string> = {
    REGULAR: t.classTypes.REGULAR,
    TRIAL: t.classTypes.TRIAL,
    ADVANCE: t.classTypes.ADVANCE,
  };
  return (
    <Stack direction="row" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <TimezoneSelect
          value={toGraphqlIanaTimezone(timezone)}
          onChangeAction={value => {
            setTimezone(value ? fromGraphqlIanaTimezone(value) : "");
          }}
          label={t.fields.timezone}
          fullWidth
          disabled={mutationLoading}
        />
      </Box>
      <FormControl fullWidth>
        <InputLabel id="class-type-select-label">{t.fields.classType}</InputLabel>
        <Select
          labelId="class-type-select-label"
          id="class-type-select"
          value={classType}
          label={t.fields.classType}
          onChange={e => setClassType(e.target.value)}
          disabled={mutationLoading}
        >
          {CLASS_TYPE_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>
              {classTypeLabels[opt]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

function DayScheduleItem({
  dayConfig,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
}: {
  readonly dayConfig: DayScheduleConfig;
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  const d = dayConfig;
  const dayLabels: Record<string, string> = {
    monday: t.days.monday,
    tuesday: t.days.tuesday,
    wednesday: t.days.wednesday,
    thursday: t.days.thursday,
    friday: t.days.friday,
    saturday: t.days.saturday,
    sunday: t.days.sunday,
  };
  return (
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
        control={<Checkbox checked={d.enabled} onChange={() => toggleDay(d.day)} disabled={mutationLoading} />}
        label={dayLabels[d.day.toLowerCase()]}
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
            label={t.timeOverride.addOverride}
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
  );
}

function DayScheduleList({
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
}: {
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t.fields.days}
      </Typography>
      <Stack spacing={1}>
        {days.map(d => (
          <DayScheduleItem
            key={d.day}
            dayConfig={d}
            toggleDay={toggleDay}
            toggleTimeOverride={toggleTimeOverride}
            setTimeOverride={setTimeOverride}
            mutationLoading={mutationLoading}
            t={t}
          />
        ))}
      </Stack>
    </Box>
  );
}

function DialogFormContent({
  teacherId,
  state,
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  students,
  loadingStudents,
  mutationLoading,
  meetingConfigWarning,
  createdClassInstanceId,
  t,
  tMeeting,
  tRecurringSchedule,
  router,
}: {
  readonly teacherId: string;
  readonly state: ReturnType<typeof useDialogFormState>;
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly students: readonly { readonly id: string; readonly name: string }[];
  readonly loadingStudents: boolean;
  readonly mutationLoading: boolean;
  readonly meetingConfigWarning: boolean;
  readonly createdClassInstanceId: string | null;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly router: ReturnType<typeof useRouter>;
}) {
  return (
    <DialogContent>
      <Stack spacing={3}>
        {meetingConfigWarning ? (
          <MeetingConfigWarningAlert
            createdClassInstanceId={createdClassInstanceId}
            tMeeting={tMeeting}
            tRecurringSchedule={tRecurringSchedule}
            router={router}
          />
        ) : null}
        <StudentSelectField
          studentId={state.studentId}
          setStudentId={state.setStudentId}
          students={students}
          loadingStudents={loadingStudents}
          mutationLoading={mutationLoading}
          t={t}
        />
        <DurationTimeFields
          duration={state.duration}
          setDuration={state.setDuration}
          defaultStartTime={state.defaultStartTime}
          setDefaultStartTime={state.setDefaultStartTime}
          mutationLoading={mutationLoading}
          t={t}
        />
        <TimezoneClassTypeFields
          timezone={state.timezone}
          setTimezone={state.setTimezone}
          classType={state.classType}
          setClassType={state.setClassType}
          mutationLoading={mutationLoading}
          t={t}
        />
        <DayScheduleList
          days={days}
          toggleDay={toggleDay}
          toggleTimeOverride={toggleTimeOverride}
          setTimeOverride={setTimeOverride}
          mutationLoading={mutationLoading}
          t={t}
        />
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={state.meetingConfig}
          onChangeAction={state.setMeetingConfig}
          disabled={mutationLoading}
        />
      </Stack>
    </DialogContent>
  );
}

export function CreateRecurringClassDialog({ teacherId, onRefetch }: Readonly<CreateRecurringClassDialogProps>) {
  const t = useAppTranslation("dashboard.teacherCreateRecurringClass");
  const tMeeting = useAppTranslation("ui").meetingConfig.manager;
  const tRecurringSchedule = useAppTranslation("ui").meetingConfig.recurringSchedule;
  const tClassScope = useAppTranslation("ui").meetingConfig.classScope;
  const notifications = useNotifications();
  const client = useApolloClient();
  const router = useRouter();
  const { isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();

  const state = useDialogFormState(isDialogOpen, resetDays);

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

  const students = studentsData?.students?.data || [];
  const validateBeforeSubmit = useValidation(state, days, notifications, t, tClassScope, tMeeting);

  const completeSuccessfulCreate = useCallback(
    async (result: NonNullable<Awaited<ReturnType<typeof createClassMutation>>["data"]>["createRecurringClass"]) => {
      if (!result) {
        return;
      }

      const recurringScheduleId = result.recurringScheduleId;
      const firstClassInstanceId = result.classInstanceIds?.[0] ?? null;
      let meetingConfigSaved = true;

      if (recurringScheduleId) {
        const meetingResult = await postCreateRecurringMeetingConfig(client, recurringScheduleId, state.meetingConfig);
        meetingConfigSaved = meetingResult.success;
        if (!meetingResult.success) {
          state.setMeetingConfigWarning(true);
          state.setCreatedClassInstanceId(firstClassInstanceId);
        }
      }

      notifications.show(t.success.description(result.classInstanceCount ?? 0), {
        severity: "success",
      });
      logger.info("Recurring class created successfully", { id: result.id });

      if (onRefetch) {
        onRefetch();
      }

      if (meetingConfigSaved) {
        closeDialog();
      }
    },
    [
      client,
      state.meetingConfig,
      state.setMeetingConfigWarning,
      state.setCreatedClassInstanceId,
      notifications,
      t,
      onRefetch,
      closeDialog,
    ]
  );

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) {
      return;
    }

    try {
      const input = buildCreateRecurringClassInput(
        state.studentId,
        teacherId,
        state.duration,
        state.defaultStartTime,
        state.timezone,
        state.classType,
        days
      );

      const { data } = await createClassMutation({
        variables: { input },
      });

      if (data?.createRecurringClass) {
        await completeSuccessfulCreate(data.createRecurringClass);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to create recurring class", { err: error });
      notifications.show(t.errors.creationFailed, { severity: "error" });
    }
  };

  return (
    <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{t.dialogTitle}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogFormContent
          teacherId={teacherId}
          state={state}
          days={days}
          toggleDay={toggleDay}
          toggleTimeOverride={toggleTimeOverride}
          setTimeOverride={setTimeOverride}
          students={students}
          loadingStudents={loadingStudents}
          mutationLoading={mutationLoading}
          meetingConfigWarning={state.meetingConfigWarning}
          createdClassInstanceId={state.createdClassInstanceId}
          t={t}
          tMeeting={tMeeting}
          tRecurringSchedule={tRecurringSchedule}
          router={router}
        />
        <DialogActions>
          <Button onClick={closeDialog} disabled={mutationLoading}>
            {t.actions.cancel}
          </Button>
          <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
            <Button type="submit" variant="contained" color="primary" disabled={mutationLoading}>
              {mutationLoading ? t.actions.submitting : t.actions.create}
            </Button>
          </RequirePermission>
        </DialogActions>
      </form>
    </Dialog>
  );
}
