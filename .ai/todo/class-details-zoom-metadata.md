# Class Details: Zoom Live Metadata Integration

## Status

**Deferred** — UI components are kept; live meeting metadata is not yet wired to Zoom.

## Components Affected

- [`MetadataCard`](../../frontend/views/dashboard/classes/details/admin/MetadataCard.tsx) — latency and authorization rows
- [`ActivityHeatmap`](../../frontend/views/dashboard/classes/details/admin/ActivityHeatmap.tsx) — session activity bars
- [`LivePerformanceGrid`](../../frontend/views/dashboard/classes/details/admin/LivePerformanceGrid.tsx) — engagement, assessment, focus, health metrics
- [`PerformanceOverviewCard`](../../frontend/views/dashboard/classes/details/teacher/PerformanceOverviewCard.tsx) — attendance, grade, last-class stats

## Current Data Source

- Table: `class_instance_performance` in [`backend/db/schema/scheduling.ts`](../../backend/db/schema/scheduling.ts)
- Seed data: [`backend/db/seeds/seed-class-performance.ts`](../../backend/db/seeds/seed-class-performance.ts) (faker-generated for `outcome === TAKEN`)
- Service: [`ClassPerformanceService.logPerformance`](../../backend/services/performance/class-performance.service.ts) — **no production caller**

## Fields Needing Zoom Integration

| Field | DB column | Notes |
|-------|-----------|-------|
| `latencyMs` | `latency_ms` | Real-time connection latency during `RUNNING` sessions |
| `authorizationLabel` | `authorization_label` | Zoom OAuth / meeting security status |
| `heatmapData` | `heatmap_data` | Student input vs teacher response activity over time |
| `engagementScore`, `focusLevel`, `sessionHealth`, etc. | various | Session analytics from Zoom or LMS webhooks |

## Implementation Notes (when ready)

1. Add Zoom webhook handler or polling job that calls `ClassPerformanceService.logPerformance` when a session is `RUNNING`.
2. Map Zoom meeting/participant events to `heatmapData` array updates.
3. Expose `zoomMeetingUrl` join button (already uses DB field) — separate from analytics pipeline.
4. GraphQL `classInstance` query already returns `performance` from DB via `ClassSessionService.getClassInstanceDetail`.

## Related

- `class_instances.zoom_meeting_url` — stored at booking; join link works without Zoom API.
- `.ai/todo` — do not delete MetadataCard or ActivityHeatmap; show empty states when `performance` is null.
