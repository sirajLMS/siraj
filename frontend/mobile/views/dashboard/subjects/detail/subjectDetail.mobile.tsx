"use client";

import { DownloadOutlined, FolderOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import type { SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";
import type { SubjectDetailViewModel } from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";
import { MobileCardList, MobileCardListItem, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

function ResourceItemMobile({
  resource,
  labels,
  onDownload,
}: Readonly<{
  resource: SubjectResourceItem;
  labels: SubjectDetailViewModel["labels"];
  onDownload: (resource: SubjectResourceItem) => void;
}>) {
  return (
    <MobileCardListItem variant="edge-to-edge" interactive>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
        onClick={() => {
          if (resource.filePath) onDownload(resource);
        }}
      >
        <FolderOutlined />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodyMd">{resource.displayName ?? labels.untitledResource}</Typography>
          {resource.resourceType ? (
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {resource.resourceType}
            </Typography>
          ) : null}
        </Box>
        {resource.filePath ? (
          <IconButton
            edge="end"
            onClick={e => {
              e.stopPropagation();
              onDownload(resource);
            }}
            aria-label={labels.download}
          >
            <DownloadOutlined />
          </IconButton>
        ) : null}
      </Box>
    </MobileCardListItem>
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
  onDownloadResource,
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
        <MobileCardList
          rows={resources}
          emptyMessage={labels.noResources}
          getKey={resource => resource.id ?? ""}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={resource => (
            <ResourceItemMobile resource={resource} labels={labels} onDownload={onDownloadResource} />
          )}
        />
      </MobileSectionPanel>
    </MobilePageContainer>
  );
}
