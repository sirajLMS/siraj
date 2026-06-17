# Backend Service Layer Rules

- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern (e.g., `PermissionsService`, `ScheduleService`). 
- **NO Monolithic Services**: Do not create generic, monolithic services (like a single `DashboardService` handling everything). 
- **Business Logic Hub**: This layer should contain all business rules, orchestration, and complex permission gating before calling the repository layer.
- **SSR Usage**: Services can be used directly by Next.js Server Components (SSR) or Server Actions, so they must not rely on GraphQL-specific contexts unless passed explicitly.
