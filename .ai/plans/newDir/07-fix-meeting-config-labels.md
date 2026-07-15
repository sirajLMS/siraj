---
name: "07: Fix MeetingConfigLabels and ClassDetailsLabels callable issues"
overview: "Fix labels objects used as callable functions and missing properties"
todos:
  - id: "1"
    content: Fix CreateRecurringClassContainer.tsx - MeetingConfigLabels not callable
    status: "pending"
  - id: "2"
    content: Fix LiveSessionToolbar.tsx - MeetingConfigLabels not callable
    status: "pending"
  - id: "3"
    content: Fix classDetailsContainer.desktop.tsx - ClassDetailsLabels not callable
    status: "pending"
  - id: "4"
    content: Fix classDetailsContainer.mobile.tsx - ClassDetailsLabels not callable
    status: "pending"
  - id: "5"
    content: Fix MeetingConfigSelect.tsx - meetingConfig.classScope property
    status: "pending"
  - id: "6"
    content: Fix MeetingConfigTypeFields.tsx - meetingConfig.fields property
    status: "pending"
  - id: "7"
    content: Fix MeetingProviderSelect.tsx - meetingConfig.providerSelect property
    status: "pending"
  - id: "8"
    content: Fix useClassDetailsLabels.ts - AdminViewLabels not exported
    status: "pending"
  - id: "9"
    content: Fix RecurringSeriesMeetingPanel.tsx - namespace issues
    status: "pending"
  - id: "10"
    content: Fix ClassMeetingContextBanner.tsx - namespace issues
    status: "pending"
  - id: "11"
    content: Fix ClassMeetingConfigsSection.tsx - namespace issues
    status: "pending"
  - id: "12"
    content: Fix useMeetingConfigFormDialog.ts - namespace issues
    status: "pending"
  - id: "13"
    content: Fix MeetingConfigDeleteDialog.tsx - namespace issues
    status: "pending"
  - id: "14"
    content: Fix MeetingConfigsManager.tsx - namespace issues
    status: "pending"
  - id: "15"
    content: Fix MeetingSummarySection.tsx - namespace issues
    status: "pending"
isProject: false
---

# Plan 07: Fix MeetingConfigLabels and ClassDetailsLabels Issues

## Files to Modify (15+ files)
Meeting config and class details components.

## Key Issues
1. `MeetingConfigLabels` used as callable but it's an object type - need to use sub-namespaces
2. `ClassDetailsLabels` used as callable - same issue
3. Properties accessed via wrong path (e.g., `t.meetingConfig.classScope` vs `t.classScope`)
4. Missing exports in type definitions

## Fix Pattern
```typescript
// Before (wrong):
const t = useAppTranslation("ui").meetingConfig;
t.classScope.sectionTitle  // Error: classScope doesn't exist on MeetingConfigLabels

// After (correct):
const t = useAppTranslation("ui.meetingConfig.classScope");
t.sectionTitle  // Correct
```
