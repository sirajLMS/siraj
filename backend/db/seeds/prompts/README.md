# Seed Asset Prompts

Copy **one section at a time** into your image generator, save to the path shown, repeat.

## On-disk filenames

Avatars use descriptive names (not `01.png`):

| Persona | Files | Directory |
|---------|-------|-----------|
| Teachers | `male_1.png` … `male_4.png`, `female_1.png` … `female_3.png` | `assets/avatars/teachers/` |
| Parents | `male_1.png`, `male_2.png`, `female_1.png`, `female_2.png` | `assets/avatars/parents/` |
| Students | `male_1.png` … `male_4.png`, `female_1.png` … `female_4.png` (pool of 8) | `assets/avatars/students/` |

Logos: `assets/logos/meeting/{slug}.png`, `assets/logos/payment/{slug}.png`, `assets/logos/subjects/{slug}.png`

Canonical lists live in `backend/db/seeds/lib/avatar-file-registry.ts`.

## Workflow

1. Open the relevant `*_PROMPTS.md` file.
2. Copy one `## …` section and generate the image.
3. Save using the **descriptive filename** from the registry (see above), not necessarily `01.png`.
4. Run `bun run validate:seed-assets`.
5. Run `bun --env-file=.env run backend/db/scripts/drizzleSeed.ts` or `bun run db cleanGenerate`.

Set `SEED_SKIP_ASSET_CHECK=true` only when intentionally skipping optional logo assets.
