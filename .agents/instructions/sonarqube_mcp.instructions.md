---
applyTo: "**/*"
---

When using the SonarQube MCP server: look up project keys with `search_my_sonarqube_projects` (never guess them); use USER tokens for authentication; after fixing issues, do not re-query immediately — the server does not reflect updates right away.
