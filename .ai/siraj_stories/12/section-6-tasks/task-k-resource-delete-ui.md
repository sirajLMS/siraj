### Task K — Frontend UI: Resource Deletion

**Objective:** Add a delete action button to the existing resource management UI. Implement an explicit confirmation dialog using MUI to prevent accidental deletion. Execute the GraphQL mutation via Apollo `useMutation` upon confirmation.

**Dependencies:** Depends on Task I — requires `deleteLearningResourceMutationDocument` and generated frontend types.

**Layer-Specific Rules (Frontend Views - Flattened from frontend/views/AGENTS.md):**
- **NO `window.confirm()` or `window.prompt()`** - Use accessible MUI `<Dialog>` components for destructive actions.
- Use `useMutation` from `@apollo/client` and handle loading states within the button/dialog.
- Do not use arbitrary tailwind strings; rely on Material UI tokens.
- Wrap the delete button in `<RequirePermission permission={AppPermission.RESOURCES_DELETE}>` to hide it from unauthorized users.

**Target Files:**
- `frontend/views/dashboard/resources/components/ResourceCard.tsx` (or similar resource list item component)

**Detailed Implementation Steps:**

*Step 1: Implement Delete Action & Dialog in `ResourceCard.tsx`*

Open the component rendering individual resources (e.g., `ResourceCard.tsx`).

```tsx
// frontend/views/dashboard/resources/components/ResourceCard.tsx
import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { deleteLearningResourceMutationDocument } from "../../../../graphql/sharedDocuments/resource.documents";
import { 
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslations } from "use-intl";
import { RequirePermission } from "../../../../components/auth/RequirePermission";
import { AppPermission } from "../../../../shared/lib/enum";

interface ResourceCardProps {
  resource: { id: string; displayName: string; filePath: string; };
  onDeleted: () => void; // Callback to refresh or filter list
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDeleted }) => {
  const t = useTranslations("Dashboard.Resources");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteResource, { loading }] = useMutation(deleteLearningResourceMutationDocument, {
    variables: { id: resource.id },
    onCompleted: () => {
      setDialogOpen(false);
      onDeleted();
    },
    onError: (err) => {
      // Typically show an error toast here
      console.error(err);
    }
  });

  return (
    <>
      {/* Existing Card Content ... */}
      
      <RequirePermission permission={AppPermission.RESOURCES_DELETE}>
        <IconButton onClick={() => setDialogOpen(true)} color="error" aria-label={t("delete")}>
          <DeleteIcon />
        </IconButton>
      </RequirePermission>

      <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)}>
        <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteConfirmationMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button onClick={() => deleteResource()} color="error" variant="contained" disabled={loading}>
            {loading ? t("deleting") : t("confirmDelete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
```

*Step 2: Update Storybook (if applicable)*
Ensure the stories for this component mock the `deleteLearningResourceMutationDocument` using `MockedProvider` so the UI can be visually verified.

**Test Execution Requirements:**
- Run Storybook locally to test the dialog visually.
- Verify typescript compilation.
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] Delete button is rendered only for users with `RESOURCES_DELETE`.
- [ ] MUI Dialog is implemented properly. No native `confirm()`.
- [ ] Mutation correctly triggers deletion and handles loading state.
- [ ] UI is updated via `onDeleted` callback or cache update logic.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
