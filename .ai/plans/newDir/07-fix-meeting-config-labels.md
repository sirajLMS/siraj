---
name: "07: Fix MeetingConfigLabels callable and missing properties"
overview: "Fix MeetingConfigLabels type which is not callable and missing classScope, manager, etc."
todos:
  - id: "1"
    content: Fix CreateRecurringClassContainer - MeetingConfigLabels not callable
    status: "pending"
  - id: "2"
    content: Fix LiveSessionToolbar - MeetingConfigLabels not callable
    status: "pending"
  - id: "3"
    content: Fix classDetailsContainer.mobile/desktop - ClassDetailsLabels not callable
    status: "pending"
  - id: "4"
    content: Fix MeetingConfigSelect - meetingConfig.classScope property access
    status: "pending"
  - id: "5"
    content: Fix MeetingConfigTypeFields - meetingConfig.fields property access
    status: "pending"
  - id: "6"
    content: Fix MeetingProviderSelect - meetingConfig.providerSelect property access
    status: "pending"
isProject: false
---

# Plan 07: Fix MeetingConfigLabels Issues

## Files to Modify
- `frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer.tsx`
- `frontend/common/views/dashboard/classes/details/components/LiveSessionToolbar.tsx`
- `frontend/desktop/views/dashboard/classes/details/classDetailsContainer.desktop.tsx`
- `frontend/mobile/views/dashboard/classes/details/classDetailsContainer.mobile.tsx`
- `frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelect.tsx`
- `frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields.tsx`
- `frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect.tsx`

## Key Issues
1. MeetingConfigLabels used as callable but it's an object type
2. Properties like classScope, fields, providerSelect accessed via wrong namespace
3. Need to use useAppTranslation("ui.meetingConfig") and access sub-properties
