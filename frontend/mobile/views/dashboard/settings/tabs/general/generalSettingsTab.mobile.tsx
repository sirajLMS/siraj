"use client";

import { TagOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { SystemSettingMetadataRow } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingMetadataRow";
import { SystemSettingValueField } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingValueField";
import type {
  GeneralSettingsViewModel,
  SystemSettingRow,
} from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { MobileCardList, MobileCardListItem, MobileSectionPanel } from "@/frontend/mobile/components/ui";

function GeneralSettingCard({
  row,
  canManage,
  labels,
  savingCode,
  onValueChange,
}: Readonly<{
  readonly row: SystemSettingRow;
  readonly canManage: boolean;
  readonly labels: GeneralSettingsViewModel["labels"];
  readonly savingCode: string | null;
  readonly onValueChange: (code: string, value: string) => void | Promise<void>;
}>) {
  const dataTypeLabel = labels.dataTypeLabels[row.dataType];
  const isSaving = savingCode === row.code;

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ typography: "labelSm", fontWeight: 700, wordBreak: "break-word" }}>{row.label}</Typography>
          <Typography
            sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, wordBreak: "break-word" }}
          >
            {row.slug}
          </Typography>
        </Box>

        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>
            {labels.dataTypeColumn}: {dataTypeLabel}
          </Typography>
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>
            {labels.categoryColumn}: {labels.categories[row.category]}
          </Typography>
        </Stack>

        <Box>
          <Typography sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary, mb: 1 }}>
            {labels.valueColumn}
          </Typography>
          <SystemSettingValueField row={row} canEdit={canManage} disabled={isSaving} onValueChange={onValueChange} />
        </Box>

        <Box>
          <SystemSettingMetadataRow
            icon={<TagOutlined fontSize="small" />}
            label={labels.descriptionColumn}
            value={row.description}
          />
        </Box>
      </Stack>
    </MobileCardListItem>
  );
}

export function GeneralSettingsTabMobileView({
  rows,
  loading,
  canManage,
  labels,
  savingCode,
  onValueChange,
}: Readonly<GeneralSettingsViewModel>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileSectionPanel title={labels.title} subTitle={labels.subtitle} />

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.empty}
        getKey={row => row.code}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={row => (
          <GeneralSettingCard
            row={row}
            canManage={canManage}
            labels={labels}
            savingCode={savingCode}
            onValueChange={onValueChange}
          />
        )}
      />
    </Box>
  );
}
