# Spec — Notification Preferences

## Purpose

Cross-cutting profile tab for own-scope users to manage notification channel/event toggles. Shown on teacher, parent, and staff own profiles. Admin cannot edit another user's preferences on profile (privacy).

## Audience & scope

| Scope | Visibility | Permissions |
|-------|------------|-------------|
| Own | `/profile?tab=notifications` | `auth.view_own_profile` |
| Admin | **Hidden** | — |

## Stitch references

**Project ID:** `3409377417207008542`

No dedicated Stitch screen. Tab placement inferred from teacher/parent/staff profile designs (Notifications tab in tab bar).

## Layout sections

| Section | Label | Entity field | Own view | Own edit |
|---------|-------|--------------|----------|----------|
| Matrix | Channel × EventType grid | `user_notification_preferences` | Yes | Yes |
| Row | Email / Push / SMS channels | `channel` enum | Yes | Yes |
| Column | Event types | `eventType` enum | Yes | Yes |
| Cell | Enabled toggle | `enabled` boolean | Yes | Yes |

## Entity schema

Table: `user_notification_preferences`
- `userId` (FK)
- `channel` — notification channel enum
- `eventType` — notification event type enum
- `enabled` — boolean, default true

RLS: users manage own preferences only.

## Responsive behavior

- **Desktop:** Toggle matrix table (channels as rows, events as columns)
- **Mobile:** Accordion per channel with event toggles inside

## Animations

- Toggle switch animation on enable/disable
- Skeleton matrix during load
- Success snackbar on save

## Acceptance criteria

- [ ] Tab visible only for own scope on all audiences
- [ ] Grid shows all channel × event combinations
- [ ] Toggle saves via mutation with optimistic update
- [ ] Defaults applied when no preference row exists
- [ ] Admin scope does not show notifications tab
- [ ] Layout consistent with Stitch tab placement on profile pages


- [ ] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- No Stitch design for the preferences matrix — derive from Material Design patterns + profile tab context
- `user_device_tokens` out of scope (device management, not profile)

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.
