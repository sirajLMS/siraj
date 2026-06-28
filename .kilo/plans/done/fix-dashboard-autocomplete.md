## Plan: Fix MUI Autocomplete on Dashboard

### Problem
On the `/dashboard` page, the MUI Autocomplete component for selecting a teacher always displays "select teacher" instead of the currently selected teacher's name in its input field.

### Proposed Steps

1.  **Locate the relevant files:**
    *   Find the dashboard component file(s) in `frontend/views/dashboard/` that contains the MUI Autocomplete for teacher selection.
    *   Identify any associated Zustand stores in `frontend/stores/` that manage the `selectedTeacher` state.

2.  **Analyze Autocomplete implementation:**
    *   Read the component file to examine the `Autocomplete` component's props, specifically `value`, `options`, `getOptionLabel`, and `onChange`.
    *   Understand how the `selectedTeacher` state is managed and passed to the `Autocomplete`.

3.  **Pinpoint the discrepancy:**
    *   Verify that the `value` prop of the `Autocomplete` is correctly bound to the `selectedTeacher` state.
    *   Ensure the format of the `selectedTeacher` object (if it's an object) matches the format expected by the `Autocomplete`'s `value` prop and `getOptionLabel`.
    *   Check if the `onChange` handler correctly updates the `selectedTeacher` state when a new teacher is selected.

4.  **Implement the fix (conceptual):**
    *   Adjust the `value` prop of the `Autocomplete` to correctly reflect the `selectedTeacher` state.
    *   Ensure consistency between the `selectedTeacher` state and the `Autocomplete`'s expected `value` format.

### Validation

*   After applying the fix, navigate to the dashboard page.
*   Select a teacher from the Autocomplete dropdown.
*   Verify that the input field of the Autocomplete now displays the name of the selected teacher.
*   Reload the page (if applicable) and confirm the selected teacher persists in the input field.
*   Run `bun quality-gate` to ensure no new issues are introduced.
