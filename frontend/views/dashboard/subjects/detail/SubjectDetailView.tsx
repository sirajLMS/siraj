"use client";

import { DownloadOutlined, FolderOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { SubjectDetailViewProps, SubjectResourceItem } from "@/frontend/views/dashboard/subjects/detail/types";

function ResourceItem({ resource }: { readonly resource: SubjectResourceItem }) {
  const t = useTranslations("dashboard.subjects.detail");
  const handleDownload = () => {
    if (resource.filePath) {
      window.open(`/api/storage/files/` + `${resource.filePath}`, `_blank`, "noopener,noreferrer");
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        resource.filePath ? (
          <IconButton edge="end" onClick={handleDownload} aria-label={t("detail.detail.download")}>
            <DownloadOutlined />
          </IconButton>
        ) : undefined
      }
    >
      <ListItemButton onClick={handleDownload} disabled={!resource.filePath}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          <FolderOutlined />
        </ListItemIcon>
        <ListItemText
          primary={resource.displayName ?? t("untitledResource")}
          secondary={resource.resourceType ?? undefined}
        />
      </ListItemButton>
    </ListItem>
  );
}

export function SubjectDetailView({ subject, resources, breadcrumbs }: Readonly<SubjectDetailViewProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <PageContainer>
      <PageHeader title={subject.name ?? ""} subtitle={subject.description ?? undefined} breadcrumbs={breadcrumbs} />

      {subject.category && (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Chip label={subject.category.name ?? ""} size="small" variant="outlined" />
        </Box>
      )}

      <SectionPanel
        title={t("detail.resourcesTitle")}
        subTitle={t("detail.resourcesSubtitle", { count: resources.length })}
        sx={{ mt: 3 }}
      >
        {resources.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t("detail.noResources")}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {resources.map(resource => (
              <ResourceItem key={resource.id ?? ""} resource={resource} />
            ))}
          </List>
        )}
      </SectionPanel>
    </PageContainer>
  );
}
