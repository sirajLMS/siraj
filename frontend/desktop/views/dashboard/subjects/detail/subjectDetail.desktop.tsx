"use client";

import { DownloadOutlined, FolderOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";
import type { SubjectDetailViewModel } from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function ResourceItemDesktop({
  resource,
  labels,
}: Readonly<{ resource: SubjectResourceItem; labels: SubjectDetailViewModel["labels"] }>) {
  const handleDownload = () => {
    if (resource.filePath) {
      window.open(`/api/storage/files/${resource.filePath}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        resource.filePath ? (
          <IconButton edge="end" onClick={handleDownload} aria-label={labels.download}>
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
          primary={resource.displayName ?? labels.untitledResource}
          secondary={resource.resourceType ?? undefined}
        />
      </ListItemButton>
    </ListItem>
  );
}

/**
 * SubjectDetailDesktopView — desktop-tier subject detail page.
 *
 * Uses the desktop page primitives (`DesktopPageContainer`/`DesktopPageHeader`)
 * with the desktop-default `headlineLg` title variant and an inset
 * `SectionPanel` (with `mt: 3` margin above) typical of the desktop layout.
 */
export function SubjectDetailDesktopView({
  subject,
  resources,
  breadcrumbs,
  loading,
  notFound,
  labels,
}: Readonly<SubjectDetailViewModel>) {
  if (loading) {
    return (
      <DesktopPageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </DesktopPageContainer>
    );
  }

  if (notFound || !subject) {
    return (
      <DesktopPageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Typography variant="bodyMd">{labels.notFound}</Typography>
        </Box>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={subject.name ?? ""}
        subtitle={subject.description ?? undefined}
        breadcrumbs={breadcrumbs}
      />

      {subject.category && (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Chip label={subject.category.name ?? ""} size="small" variant="outlined" />
        </Box>
      )}

      <SectionPanel title={labels.resourcesTitle} subTitle={labels.resourcesSubtitle(resources.length)} sx={{ mt: 3 }}>
        {resources.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.noResources}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {resources.map(resource => (
              <ResourceItemDesktop key={resource.id ?? ""} resource={resource} labels={labels} />
            ))}
          </List>
        )}
      </SectionPanel>
    </DesktopPageContainer>
  );
}
