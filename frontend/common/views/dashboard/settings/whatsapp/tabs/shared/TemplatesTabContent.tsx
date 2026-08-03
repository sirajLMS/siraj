"use client";

import { CloudSyncOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { statusChipColor } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/statusChipColor";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/** Shared inner content for TemplatesTab — used by both desktop and mobile wrappers. */
export function TemplatesTabContent({
  labels,
  templates,
  loading,
  syncing,
  onSyncFromMeta,
}: Readonly<TemplatesTabSharedProps>) {
  const t = labels.page;

  if (loading && !syncing) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="titleLg">{t.templatesTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {t.templatesSubtitle}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<CloudSyncOutlined />} disabled={syncing} onClick={onSyncFromMeta}>
          {syncing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {t.syncTemplates}
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, py: 4, textAlign: "center" }}>
          {t.noTemplates}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {templates.map(template => (
            <Card key={template.id} variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
                      {template.name ?? "—"}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                      <Chip size="small" label={`${t.templateLanguage}: ${template.language}`} />
                      <Chip size="small" label={`${t.templateCategory}: ${template.category}`} />
                      <Chip size="small" label={template.status ?? "—"} color={statusChipColor(template.status)} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
