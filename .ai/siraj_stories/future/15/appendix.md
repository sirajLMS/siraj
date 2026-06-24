## Appendix

### A. File Creation Summary

| Category | New Files | Modified Files |
|---|---|---|
| Migration/Schema/Enum | 1 (migration) | 4 (enum.ts, enums.ts, communications.ts, drizzleRelations.ts) |
| **Canonical Types** | **~4 (suggestions, complaints, notification-deliveries, user-notification-preferences)** | **~2 (complaint-responses, complaint types)** |
| Repositories | 0 | 3 (suggestion, notification, complaint repos) |
| Communication Channels | ~12 (interfaces, adapters, factories, templates per channel) | 1 (communication.service.ts) |
| Services | 0 | 2 (complaint, suggestion services) |
| Tests (repo) | 2 | 1 |
| Tests (service) | 3 | 0 |
| GraphQL Pothos | 0 | 2 (complaint, suggestion pothos) |
| Frontend Documents | 0 | 2 |
| Type Extraction | 0 | ~15 |
| Tests (GraphQL) | 0 | 2 |
| Storybook | 0 | 4 |
| Stores | 1 | 3 |
| Views/Components | 7 | ~12 |
| System Settings | 0 | 1 (seeder) |
| i18n | 0 | ~6 |
| Env declarations | 0 | 1 (environment.d.ts) |
| **Total** | **~30 new** | **~61 modified** |

### B. Dependency Graph

```
Layer 1: DB/Schema
  Task A (Migration/Schema/Permissions)

Layer 2: Repositories + Tests
  Task B1 (Suggestion Repository)
  Task B2 (Notification Repository)
  Task B3 (Complaint Repository)
  Task B4 (Repository Tests)

Layer 3: System Settings
  Task C (System Settings Seeder)

Layer 4: Communication Channels
  Task D1 (Email Channel — Resend)
  Task D2 (SMS Channel — Twilio)
  Task D3 (Push Channel — FCM)

Layer 5: Services + Tests
  Task E1 (Suggestion Service)
  Task E2 (Complaint Service)
  Task E3 (Communication Service)
  Task E4 (Service Tests)

Layer 6: Backend GraphQL
  Task F (GraphQL Pothos)

Layer 7: Frontend GraphQL + Tests
  Task G (Frontend Documents)
  Task H (GraphQL Tests)

Layer 8: Types + Storybook
  Task I (Type Extraction)
  Task J (Storybook Migration)

Layer 9: Frontend Stores
  Task K (Frontend Stores)

Layer 10: Frontend Views
  Task L1 (Suggestion Admin UI)
  Task L2 (Parent Suggestion History)
  Task L3 (Complaint File Upload UI)

Layer 11: i18n
  Task M (i18n)
```

### C. Provider/Adapter Pattern Reference

Each communication channel follows this structure (mirroring `StorageService`, `CacheService`, `RedisService`):

```
backend/services/communication/
├── communication.service.ts              # dispatch() + dispatchMulti()
├── channels/
│   ├── email/
│   │   ├── IEmailChannel.ts              # Interface: send(), validateConfig()
│   │   ├── EmailChannelFactory.ts        # Reads EMAIL_PROVIDER env var
│   │   ├── resend/
│   │   │   ├── ResendEmailAdapter.ts     # implements IEmailChannel
│   │   │   ├── resend.types.ts           # ResendContext
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── sms/
│   │   ├── ISmsChannel.ts
│   │   ├── SmsChannelFactory.ts          # Reads SMS_PROVIDER env var
│   │   ├── twilio/
│   │   │   ├── TwilioSmsAdapter.ts       # implements ISmsChannel
│   │   │   ├── twilio.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── push/
│       ├── IPushChannel.ts
│       ├── PushChannelFactory.ts         # Reads PUSH_PROVIDER env var
│       ├── fcm/
│       │   ├── FcmPushAdapter.ts         # implements IPushChannel
│       │   ├── fcm.types.ts
│       │   └── index.ts
│       └── index.ts
├── templates/
│   ├── email-templates.ts
│   └── sms-templates.ts
├── complaint.service.ts
└── suggestion.service.ts
```

### D. Environment Variables

| Variable | Channel | Required | Default |
|---|---|---|---|
| `EMAIL_PROVIDER` | Email | No | `"resend"` |
| `RESEND_API_KEY` | Email (Resend) | Yes (if provider=resend) | — |
| `RESEND_FROM_EMAIL` | Email (Resend) | Yes (if provider=resend) | — |
| `SMS_PROVIDER` | SMS | No | `"twilio"` |
| `TWILIO_ACCOUNT_SID` | SMS (Twilio) | Yes (if provider=twilio) | — |
| `TWILIO_AUTH_TOKEN` | SMS (Twilio) | Yes (if provider=twilio) | — |
| `TWILIO_FROM_NUMBER` | SMS (Twilio) | Yes (if provider=twilio) | — |
| `PUSH_PROVIDER` | Push | No | `"fcm"` |
| `FIREBASE_PROJECT_ID` | Push (FCM) | Yes (if provider=fcm) | — |
| `FIREBASE_PRIVATE_KEY` | Push (FCM) | Yes (if provider=fcm) | — |
| `FIREBASE_CLIENT_EMAIL` | Push (FCM) | Yes (if provider=fcm) | — |

### E. Temp File Index

| Temp File | Purpose |
|---|---|
| `temp/M1-schema-analysis.md` | Suggestion schema changes (6 columns, enum, indexes) |
| `temp/M2-permission-gap.md` | 3 new + 4 deferred permissions, academy_admin gap |
| `temp/M3-communication-service.md` | CommunicationService interface, channel requirements |
| `temp/M4-notification-infra.md` | NotificationRepository methods, enum gaps, preference CRUD |
| `temp/M5-storage-integration.md` | complaintFiles flow, dropzone pattern, system settings |
| `temp/M6-frontend-analysis.md` | Admin suggestion UI, complaint form, new components |
| `temp/M7-dependency-graph.md` | 20-task layered build order |
| `temp/M8-user-decisions.md` | 10 confirmed decisions |

### F. User-Confirmed Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Email provider | Resend |
| 2 | SMS provider | Twilio |
| 3 | Push platform | Firebase Cloud Messaging |
| 4 | Complaint file types | Wide variety (docx, pdf, images, text, markdown), max size from system settings |
| 5 | Admin suggestion actions | Mark reviewed + respond + mark duplicate (GitHub-style) + delete |
| 6 | Story 14 permissions | Assume Story 14 executed first |
| 7 | Suggestion deletion | Soft-delete (add deletedAt) |
| 8 | Parent suggestion history | Yes, add history section |
| 9 | ON_APP channel | Yes, add to enum |
| 10 | Provider pattern | Interface + Adapter + Factory per channel (mirroring StorageService) |
