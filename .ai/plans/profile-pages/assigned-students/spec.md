# Spec — Assigned Students (Teacher Tab)

## Purpose

Admin-only tab on teacher profile listing assigned students with filters, grid, and pagination. Parent audience uses inline Associated Students on parent-profile instead.

## Audience & scope

| Scope | Visibility | Permissions |
|-------|------------|-------------|
| Own | **Hidden** | — |
| Admin view | `/users/[userId]/profile?tab=students` | `user.edit_profile`, teacher view |

## Stitch references

**Project ID:** `3409377417207008542`

| Viewport | Screen | Screen ID |
|----------|--------|-----------|
| Desktop | Animated Teacher Assigned Students (Admin View) | `e185317d3a684c0d8d5686d5c5e99a5a` |
| Mobile | **GAP** — no animated happy-path | Static fallback `6c0c5c5a908447e394cbc7b16e7d54b4` |

**State screens — desktop:** loading `7fb40d79a6874e05b83f84f94f381e64`, empty `ae027143a05c41d3a4dfab0aabbb5023`, error `b3367758d53e4767aeddd30b316b92ce`

**State screens — mobile:** loading `1210dd37c9184397879c69b87699e6ea`, empty `a76b6f90f7fc4517871f22c5414067c6`, error `271cce57da4942dbae63f9260e67245c`

## Layout sections

| Section | Stitch label | Data source |
|---------|--------------|-------------|
| Filters | All Grades / Grade filter | Client filter on grade level |
| Grid | Student Name | `TeacherAssignedStudentReturnType.name` |
| Grid | Class | assignment class name |
| Grid | Grade | student grade level |
| Grid | Attendance Rate | computed metric |
| Grid | Performance | computed metric |
| Footer | Pagination | `totalCount`, page size |

## Field matrix

Read-only grid — no inline edit on profile.

## Responsive behavior

- **Desktop:** Full data grid with column headers
- **Mobile:** Card list per student (from static fallback); filters as chip row

## Animations

- Row stagger on load
- Skeleton rows during loading state
- Empty illustration when no assignments
- Error with retry

## Acceptance criteria

- [ ] Tab visible only for teacher admin scope
- [ ] Grid shows student name, class, grade, attendance, performance
- [ ] Grade filter works client-side or server-side
- [ ] Pagination shows "Showing X to Y of Z entries"
- [ ] Empty and error states match Stitch animated references
- [ ] Mobile card list from static fallback


- [ ] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- No animated mobile happy-path main

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **assigned-students-desktop-happy**: `stitch-assets/html/assigned-students-desktop-happy.html` | `stitch-assets/screenshots/assigned-students-desktop-happy.png`
- **assigned-students-mobile-static**: `stitch-assets/html/assigned-students-mobile-static.html` | `stitch-assets/screenshots/assigned-students-mobile-static.png`
