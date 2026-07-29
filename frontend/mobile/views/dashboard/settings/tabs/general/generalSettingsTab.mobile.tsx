"use client";

import { AddOutlined, CalendarMonthOutlined, LockOutlined, TagOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { SystemSettingDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingDeleteDialog";
import { SystemSettingFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingFormDialog";
import { SystemSettingMetadataRow } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingMetadataRow";
import { SystemSettingRowActions } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingRowActions";
import type {
  GeneralSettingsViewModel,
  SystemSettingRow,
} from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { MobileCardList, MobileCardListItem, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale";

function GeneralSettingCard({
  row,
  locale,
  canManage,
  labels,
  onEdit,
  onDelete,
}: Readonly<{
  readonly row: SystemSettingRow;
  readonly locale: string;
  readonly canManage: boolean;
  readonly labels: GeneralSettingsViewModel["labels"];
  readonly onEdit: (row: SystemSettingRow) => void;
  readonly onDelete: (row: SystemSettingRow) => void;
}>) {
  const dataTypeLabel = labels.dataTypeLabels[row.dataType];

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Typography sx={{ typography: "titleSm", fontWeight: 700, wordBreak: "break-word", flex: 1 }}>
            {row.key}
          </Typography>
          {canManage ? (
            <SystemSettingRowActions
              editLabel={labels.editLabel}
              deleteLabel={labels.deleteLabel}
              onEdit={() => onEdit(row)}
              onDelete={() => onDelete(row)}
            />
          ) : null}
        </Box>

        <Typography
          sx={theme => ({
            typography: "headlineMd",
            fontWeight: 700,
            color: theme.palette.primary.main,
            wordBreak: "break-word",
          })}
        >
          {row.value}
        </Typography>

        <Box>
          <SystemSettingMetadataRow
            icon={<LockOutlined fontSize="small" />}
            label={labels.categoryColumn}
            value={labels.categories[row.category]}
          />
          <SystemSettingMetadataRow
            icon={<TagOutlined fontSize="small" />}
            label={labels.dataTypeColumn}
            value={dataTypeLabel}
          />
          {row.updatedAt ? (
            <SystemSettingMetadataRow
              icon={<CalendarMonthOutlined fontSize="small" />}
              label={labels.updatedAtColumn}
              value={formatDateTime(row.updatedAt, locale)}
            />
          ) : null}
        </Box>

        {row.description ? (
          <Typography sx={{ typography: "bodySm", wordBreak: "break-word" }}>
            <Box component="span" sx={{ color: theme => theme.palette.text.secondary }}>
              {labels.descriptionColumn}:{" "}
            </Box>
            {row.description}
          </Typography>
        ) : null}
      </Stack>
    </MobileCardListItem>
  );
}

export function GeneralSettingsTabMobileView({
  rows,
  loading,
  canManage,
  labels,
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  onAdd,
  onEdit,
  onDelete,
  onFormClose,
  onDeleteClose,
  onSaved,
  onConfirmDelete,
}: Readonly<GeneralSettingsViewModel>) {
  const locale = useAppLocale();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ px: 2 }}>
        <Typography sx={{ typography: "titleLg", mb: 1 }}>{labels.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mb: 2 }}>
          {labels.subtitle}
        </Typography>
        {canManage ? (
          <MobilePrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />} fullWidth>
            {labels.addLabel}
          </MobilePrimaryPageAction>
        ) : null}
      </Box>

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.empty}
        getKey={row => row.id}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={row => (
          <GeneralSettingCard
            row={row}
            locale={locale}
            canManage={canManage}
            labels={labels}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      />

      {canManage ? (
        <>
          <SystemSettingFormDialog
            open={formOpen}
            row={editRow}
            labels={labels}
            onClose={onFormClose}
            onSaved={onSaved}
          />
          <SystemSettingDeleteDialog
            open={deleteRow != null}
            row={deleteRow}
            labels={labels}
            isLoading={isDeleting}
            onClose={onDeleteClose}
            onConfirm={() => {
              void onConfirmDelete();
            }}
          />
        </>
      ) : null}
    </Box>
  );
}
