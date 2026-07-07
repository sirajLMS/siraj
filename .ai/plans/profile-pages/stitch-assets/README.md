# Stitch Local Assets

Offline copies of canonical profile-page Stitch screens. **Use these instead of calling Stitch MCP during implementation.**

## Manifest

See [manifest.json](./manifest.json) for screen IDs, titles, and file paths.

## Layout

```
stitch-assets/
├── manifest.json
├── html/           # Stitch HTML exports (layout reference)
├── screenshots/    # PNG screenshots (visual reference)
└── README.md
```

## Usage

1. Open the HTML file for structure/section labels
2. Open the PNG for visual spacing and hierarchy
3. Map layout to Siraj theme (`frontend/THEME_PALETTE.md`) — ignore Stitch Navy/Warm colors

## Refresh

```bash
bun run .ai/plans/profile-pages/scripts/fetch-stitch-assets.ts
```

Project ID: `3409377417207008542`
