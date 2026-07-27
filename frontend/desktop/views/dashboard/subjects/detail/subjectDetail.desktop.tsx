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
import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import type { SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";
import type { SubjectDetailViewModel } from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function ResourceItemDesktop({
  resource,
  labels,
  onDownload,
}: Readonly<{
  resource: SubjectResourceItem;
  labels: SubjectDetailViewModel["labels"];
  onDownload: (resource: SubjectResourceItem) => void;
}>) {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        resource.filePath ? (
          <IconButton edge="end" onClick={() => onDownload(resource)} aria-label={labels.download}>
            <DownloadOutlined />
          </IconButton>
        ) : undefined
      }
    >
      <ListItemButton onClick={() => onDownload(resource)} disabled={!resource.filePath}>
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
  onDownloadResource,
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <ClassAvatar src={subject.avatarUrl ?? undefined} label={subject.name ?? ""} size={56} />
        <Box sx={{ flex: 1 }}>
          <DesktopPageHeader
            title={subject.name ?? ""}
            subtitle={subject.description ?? undefined}
            breadcrumbs={breadcrumbs}
          />
        </Box>
      </Box>

      {subject.category && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Chip label={subject.category.name ?? ""} size="small" variant="outlined" />
        </Box>
      )}

      <DesktopSectionPanel
        title={labels.resourcesTitle}
        subTitle={labels.resourcesSubtitle(resources.length)}
        sx={{ mt: 3 }}
      >
        {resources.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.noResources}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {resources.map(resource => (
              <ResourceItemDesktop
                key={resource.id ?? ""}
                resource={resource}
                labels={labels}
                onDownload={onDownloadResource}
              />
            ))}
          </List>
        )}
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
