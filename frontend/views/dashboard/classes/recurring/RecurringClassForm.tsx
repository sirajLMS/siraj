"use client";

import { AddOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography } from "@mui/material";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { StudentGroup } from "@/frontend/stores/mockCreateRecurringClassStore";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";
import { RecurringClassFormFields } from "./RecurringClassFormFields";
import type { RecurringClassFormData } from "./recurringClassSchema";

interface RecurringClassFormProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RecurringClassFormData>;
  readonly studentGroups: readonly StudentGroup[];
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly showSuccess: boolean;
  readonly labels: Pick<
    CreateRecurringClassLabels,
    | "add"
    | "addClass"
    | "addedSuccessfully"
    | "students"
    | "studentsPlaceholder"
    | "defaultStartTime"
    | "duration"
    | "durationHours"
    | "durationMinutes"
    | "hours"
    | "minutes"
    | "daysSelection"
    | "classSchedule"
    | "timeOverride"
    | "weekendOff"
    | "days"
  >;
  readonly onSubmit: (data: RecurringClassFormData) => void;
}

export function RecurringClassForm({
  register,
  errors,
  watch,
  setValue,
  control,
  handleSubmit,
  studentGroups,
  isSubmitting,
  isMobile,
  showSuccess,
  labels,
  onSubmit,
}: RecurringClassFormProps) {
  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: isMobile ? 2 : 3,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: theme => theme.palette.divider,
            borderRadius: 2,
          },
        }}
      >
        <RecurringClassFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          studentGroups={studentGroups}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
          labels={labels}
        />
      </Box>

      <Box
        sx={theme => ({
          p: isMobile ? 2 : 3,
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : "space-between",
          borderTop: 1,
          borderColor: theme.palette.divider,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          ...(isMobile && {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 2,
            pb: "calc(16px + env(safe-area-inset-bottom))",
          }),
        })}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isMobile ? undefined : <AddOutlined />}
          endIcon={isMobile ? <AddOutlined /> : undefined}
          fullWidth={isMobile}
          sx={theme => ({
            bgcolor: theme.palette.sidebar,
            color: theme.palette.onSidebar,
            borderRadius: 10,
            px: isMobile ? 4 : 5,
            py: isMobile ? 1.75 : 1.5,
            typography: "labelUppercase",
            boxShadow: theme.palette.shadow.button,
            "&:hover": {
              bgcolor: theme.palette.sidebar,
              filter: "brightness(1.1)",
            },
            maxWidth: isMobile ? 480 : undefined,
          })}
        >
          {isMobile ? labels.addClass : labels.add}
        </Button>

        {showSuccess && !isMobile && (
          <Box
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: theme.palette.status.activeContainer,
              color: theme.palette.sidebar,
              border: 1,
              borderColor: theme.palette.status.active,
            })}
          >
            <CheckCircleOutlined sx={{ fontSize: 20 }} />
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {labels.addedSuccessfully}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
