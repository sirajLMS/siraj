# Student Credit Balance & Consumption View

A logged-in student opens `/dashboard/students/credits`, which is gated by `withPageAuth` against `AppPermission.STUDENT_VIEW_OWN_DASHBOARD` and renders `StudentCreditsContainer`. The container's view model first runs the `studentProfile` query with a null student id so the server resolves the logged-in student's own id, both follow-up queries are skipped until that id exists. It then issues two Apollo queries in parallel: `studentCreditHourBalance`, which flows through `AccountingPaymentService.getStudentBalance` (IDOR-scoped via `assertAssociatedOrManage`) to `StudentRepository.getCreditHourBalance` reading `creditHoursRemaining`/`creditHoursTotal` from the `students` table, and `studentCreditTransactions`, which flows through `CreditService.getStudentTransactions` to `CreditRepository.getTransactions`/`countTransactions` against the `creditTransactions` ledger table. Each ledger row is hour-based or legacy class-based (an XOR between `changeAmountHours` and `changeAmount`), and the view model prefers `changeAmountHours` so hour grants never display as zero, filtering by `CreditReason` and pagination happen client-side over the first 100 rows. The legacy class-unit balance (`studentCreditBalance`) deliberately does not feed this page's KPI cards — it is the hour-domain view only. Result sets are rendered by lazy-loaded mobile or desktop views via `ResponsiveViewSwitch`, and resolver failures are translated to domain GraphQL errors by `mapQuotaErrorToGraphQLError`.

Key sources:

- `app/(dashboard)/students/credits/page.tsx` — auth-gated route entry point
- `frontend/common/views/dashboard/student/credits/StudentCreditsContainer.tsx` — container + responsive view switch
- `frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.ts` — view model, queries, client-side filter/pagination
- `backend/graphql/query/students/student-profile.query.ts` — `studentProfile` resolver (resolves own student id)
- `backend/graphql/query/billing/accounting.query.ts` — `studentCreditHourBalance` resolver
- `backend/graphql/query/billing/credit.query.ts` — `studentCreditTransactions` resolver
- `backend/services/billing/accounting-payment.service.ts` — `AccountingPaymentService.getStudentBalance`
- `backend/services/billing/credit.service.ts` — `CreditService.getStudentTransactions` / `getStudentHourBalance`
- `backend/db/repo/students/student.repository.ts` — `getCreditHourBalance` (reads `students` table)
- `backend/db/repo/billing/credit.repository.ts` — `getTransactions` (reads `creditTransactions` ledger)

```mermaid
%% Student Credit Balance & Consumption View — how the student's credit-hours balance and ledger history are assembled and displayed
sequenceDiagram
    autonumber
    participant U as Student (Browser)
    participant P as page.tsx (withPageAuth)
    participant C as StudentCreditsContainer
    participant VM as useStudentCreditsViewModel
    participant A as Apollo Client
    participant G as GraphQL Resolvers
    participant SP as StudentProfileService
    participant AP as AccountingPaymentService
    participant CS as CreditService
    participant R as StudentRepository / CreditRepository
    participant DB as DB (students, creditTransactions)

    U->>P: GET /dashboard/students/credits
    P->>P: withPageAuth checks STUDENT_VIEW_OWN_DASHBOARD
    P-->>U: render StudentCreditsContainer
    C->>VM: build view model
    VM->>A: studentProfile query (studentId null = own profile)
    A->>G: studentProfile resolver
    G->>SP: getProfile(userId, studentId)
    SP-->>A: profile with student id
    A-->>VM: studentId

    par Balance query
        VM->>A: studentCreditHourBalance(studentId)
        A->>G: accounting.query resolver
        G->>AP: getStudentBalance(actorUserId, studentId)
        AP->>AP: assertAssociatedOrManage (self, guardian, or ACCOUNTING_PAYMENTS_VIEW)
        AP->>R: StudentRepository.getCreditHourBalance
        R->>DB: SELECT creditHoursTotal, creditHoursRemaining FROM students
        DB-->>AP: balance row + lowHoursThreshold + lastPaymentCurrency
        AP-->>VM: creditHoursRemaining / creditHoursTotal
    and Transactions query
        VM->>A: studentCreditTransactions(studentId, hoursOnly, first 100)
        A->>G: credit.query resolver (parsePaginationArgs)
        G->>CS: getStudentTransactions(actorUserId, studentId, pagination, hoursOnly)
        CS->>CS: assertStudentExists + assertAssociatedOrManage (IDOR scope)
        CS->>R: getTransactions + countTransactions
        R->>DB: SELECT FROM creditTransactions ordered desc
        DB-->>CS: ledger rows (changeAmount XOR changeAmountHours)
        CS-->>VM: rows + totalCount
    end

    VM->>VM: mapTransaction prefers changeAmountHours, legacy rows use changeAmount
    VM->>VM: client-side CreditReason filter + pagination (page/pageSize)
    VM-->>C: StudentCreditsViewModel
    C->>C: ResponsiveViewSwitch renders mobile or desktop view
    C-->>U: KPI balance cards + transaction history table

    alt resolver error (unauthorized, not found, quota)
        G->>G: mapQuotaErrorToGraphQLError
        G-->>A: GraphQLError with domain extensions.code
        A-->>U: localized error surfaced by view
    end
```

Machine-checkable copy: [credits-view.mmd](./credits-view.mmd)
