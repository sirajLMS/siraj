# Frontend Views Layer Rules

- **Functional Components**: All React components must be written as functional components using hooks. Do NOT use React class components.
- **Domain Structure**: Components are structured by domain (e.g., `frontend/views/dashboard`). Group related views and sub-components logically within their domain folder.
- **Access Control**: When rendering components that require specific permissions, wrap them in the `<RequirePermission>` component to dynamically check user permissions against the active Zustand store.
- **Data Fetching**: Data fetching inside components should be performed by Apollo hooks (`useQuery`) with generated TypedDocumentNodes. 
