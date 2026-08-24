# Appearance Customization — HTML Prototypes

> Open these in a browser to see the visual design.

## Files

| File | Description |
|------|-------------|
| `index.html` | Settings → **Appearance tab** — the form-based settings page at `/settings?tab=appearance`. Shows the hero with "Enter Customize Mode" CTA, published/draft status, brand identity fields, logo upload, color pickers, default mode toggle, and action bar. |
| `customize-overlay.html` | **`?customize=1` overlay** — the live WYSIWYG editor. Shows the extra customization header above the app header, the extra customization sidebar left of the app sidebar, and the real dashboard underneath receiving live CSS variable updates from the color pickers. |

## Viewing

```bash
# Option 1: open in default browser
xdg-open .ai/plans/brand/prototype/index.html

# Option 2: serve on localhost
python3 -m http.server 8888 -d .ai/plans/brand/prototype
# Then open http://localhost:8888/index.html
```

## What to look for

### index.html (Settings tab)
- The appearance tab sits as the 6th tab in the existing settings tabs row
- Hero card with a mini-brand preview card (logo + site name + primary button)
- "Enter Customize Mode" CTA links to `customize-overlay.html` (`?customize=1`)
- Published / Draft dual-status badge row
- Brand identity, logo, colors, and default mode sections
- Action bar: Save Draft (accent), Publish Now (primary), Reset (ghost)

### customize-overlay.html (Live overlay)

**Structure:**
```
┌───────────────────────────────────────────────────────┐
│  Customize Toolbar (extra header, 48px, amber bar)    │
│  [🎨 Customize] [Undo][Redo] [Save][Publish] [Reset] [Exit]
├───────────┬──────────┬───────────────────────────────┤
│           │          │  Dashboard Header (56px)      │
│ Customize │ Dashboard│  ┌──────┐ Header brand+actions│
│ Sidebar   │ Sidebar  ├──┴──────┴────────────────────┤
│ (300px)   │ (240px)  │  Dashboard Content           │
│           │          │  Cards, tables, real pages   │
│ - Brand   │ - Dash   │                              │
│ - Logo    │ - Stud   │                              │
│ - Colors  │ - Teach  │                              │
│ - Mode    │ - Class  │                              │
│           │ - Set    │                              │
└───────────┴──────────┴──────────────────────────────┘
```

- Customize toolbar is simply **another header above the actual app header** — full width
- Customize sidebar is simply **a sidebar before the dashboard sidebar** — 300px
- Everything else is the **real app, unmodified** — receiving live CSS variable updates
- **Live update:** typing site name updates the dashboard header brand instantly
- **Live color:** picking a color writes `--mui-primary-main` / `--mui-secondary-main` on `:root` — entire app re-paints. In production, MUI `nativeColor: true` re-derives light/dark/contrastText via `color-mix()`
- Buttons in toolbar (Undo/Redo, Save Draft, Publish, Reset, Exit) are non-functional in prototype
