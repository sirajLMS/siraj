# Seed Asset Prompts

Human-in-the-loop image generation. **Copy one prompt section at a time** into your image model, generate, save, repeat.

## Files

| File | Images | Save location |
|------|--------|---------------|
| `TEACHER_AVATAR_PROMPTS.md` | 8 avatars | `assets/avatars/teachers/01.png` … `04.png` (pool cycles 4) |
| `STUDENT_AVATAR_PROMPTS.md` | 8 avatars | `assets/avatars/students/01.png` … `08.png` |
| `PARENT_AVATAR_PROMPTS.md` | 4 avatars | `assets/avatars/parents/01.png` … `04.png` |
| `MEETING_PROVIDER_LOGO_PROMPTS.md` | 3 logos | `assets/logos/meeting/{slug}.png` |
| `PAYMENT_CATALOG_LOGO_PROMPTS.md` | 6 logos | `assets/logos/payment/{slug}.png` |
| `CLASS_SUBJECT_AVATAR_PROMPTS.md` | 4 icons | `assets/logos/subjects/{slug}.png` |

Paths are relative to `backend/db/seeds/`.

## Workflow

1. Open the relevant `*_PROMPTS.md` file.
2. Copy **one** `## …` section (from the header through the prompt paragraph).
3. Paste into your image generator and create the image.
4. Save to the exact path shown in that section (create subfolders if needed).
5. Repeat for every section in the file.
6. Run `bun run validate:seed-assets` to confirm required files exist.
7. Run `bun run db seed` or `bun run db cleanGenerate`.

Set `SEED_SKIP_ASSET_CHECK=true` only if you intentionally want to seed without optional logo assets.

## Conventions

- **Person avatars**: 512×512 or 1024×1024 PNG, solid white background `#FFFFFF`, Pixar/Memoji 3D style, head and shoulders, no photorealistic faces.
- **Logos**: 512×512 or 1024×1024 PNG, transparent background preferred; stylized originals (not exact trademark copies).
- **Subject icons**: 512×512 or 1024×1024 PNG, white background, 3D illustration (not human portraits).
