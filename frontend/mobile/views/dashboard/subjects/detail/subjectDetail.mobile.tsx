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
import type { SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";
import type { SubjectDetailViewModel } from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

function ResourceItemMobile({
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
 * SubjectDetailMobileView — mobile-tier subject detail page.
 *
 * Renders the loading spinner, not-found message, and resource list using
 * mobile page primitives (`MobilePageContainer`, `MobilePageHeader` with the
 * mobile default `headlineMd` title variant + edge-to-edge header).
 */
export function SubjectDetailMobileView({
  subject,
  resources,
  breadcrumbs,
  loading,
  notFound,
  labels,
}: Readonly<SubjectDetailViewModel>) {
  if (loading) {
    return (
      <MobilePageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </MobilePageContainer>
    );
  }

  if (notFound || !subject) {
    return (
      <MobilePageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Typography variant="bodyMd">{labels.notFound}</Typography>
        </Box>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={subject.name ?? ""}
        subtitle={subject.description ?? undefined}
        breadcrumbs={breadcrumbs}
      />

      {subject.category && (
        <Box sx={{ mt: 1 }}>
          <Chip label={subject.category.name ?? ""} size="small" variant="outlined" />
        </Box>
      )}

      <MobileSectionPanel title={labels.resourcesTitle} subTitle={labels.resourcesSubtitle(resources.length)}>
        {resources.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.noResources}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {resources.map(resource => (
              <ResourceItemMobile key={resource.id ?? ""} resource={resource} labels={labels} />
            ))}
          </List>
        )}
      </MobileSectionPanel>
    </MobilePageContainer>
  );
}
