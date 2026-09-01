"use client";

import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { type PersonOption, resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect";
import {
  SharedDialogAssignButton,
  SharedDialogCancelButton,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/sharedDialogButtons";
import type { AssignGroupDialogSharedProps } from "@/frontend/common/views/dashboard/permissions/types/assignGroupDialogShared.types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export function AssignGroupDialogShared({ labels, props, slots }: Readonly<AssignGroupDialogSharedProps>) {
  const { open, group, isLoading, onClose, onAssign, control, errors, handleSubmit } = props;
  const t = labels;
  const { UserAutocomplete, dialogVariant, formIdSuffix } = slots;

  const assignedUserIds = useMemo(
    () =>
      group?.assignedUsers?.map((user: { id: string | null }) => user.id).filter((id): id is string => Boolean(id)) ??
      [],
    [group]
  );

  if (!group) return null;

  const onSubmit = (data: { userId: string }) => {
    onAssign(data.userId);
  };

  const titleId = `assign-group-dialog-title-${formIdSuffix}`;
  const formId = `assign-group-form-${formIdSuffix}`;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} aria-labelledby={titleId} {...dialogVariant}>
      <DialogTitle id={titleId}>
        {t.assignGroupTitle} ({resolveLocalizedString(group.name)})
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id={formId}
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Controller
            name="userId"
            control={control}
            render={({ field }) => {
              const selectedUser: PersonOption | null = field.value
                ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
                : null;

              return (
                <UserAutocomplete
                  value={selectedUser}
                  disabled={isLoading}
                  required
                  label={t.selectUserLabel}
                  placeholder={t.selectUserPlaceholder}
                  error={Boolean(errors.userId)}
                  helperText={errors.userId ? t.selectUserPlaceholder : undefined}
                  excludeIds={assignedUserIds}
                  onChange={person => {
                    if (person && assignedUserIds.includes(person.id)) {
                      return;
                    }
                    field.onChange(person?.id ?? "");
                  }}
                />
              );
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <SharedDialogCancelButton label={t.cancel} disabled={isLoading} onClick={onClose} />
        <SharedDialogAssignButton label={t.assignButton} disabled={isLoading} type="submit" form={formId} />
      </DialogActions>
    </Dialog>
  );
}
