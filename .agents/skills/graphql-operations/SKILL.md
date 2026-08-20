---
name: graphql-operations
description: >
  Guide for writing GraphQL operations (queries, mutations, fragments) following best practices. Use this skill when:
  (1) writing GraphQL queries or mutations,
  (2) organizing operations with fragments,
  (3) optimizing data fetching patterns,
  (4) setting up type generation or linting,
  (5) reviewing operations for efficiency.
license: MIT
compatibility: Any GraphQL client (Apollo Client, urql, Relay, etc.)
metadata:
  author: apollographql
  version: "1.0.0"
allowed-tools: Bash(npm:*) Bash(npx:*) Read Write Edit Glob Grep
---

# GraphQL Operations Guide

This guide covers best practices for writing GraphQL operations (queries, mutations, subscriptions) as a client developer. Well-written operations are efficient, type-safe, and maintainable.

## Operation Basics

### Query Structure

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}
```

### Mutation Structure

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    createdAt
  }
}
```

### Subscription Structure

```graphql
subscription OnMessageReceived($channelId: ID!) {
  messageReceived(channelId: $channelId) {
    id
    content
    sender {
      id
      name
    }
  }
}
```

## Quick Reference

### Operation Naming

| Pattern      | Example                                     |
| ------------ | ------------------------------------------- |
| Query        | `GetUser`, `ListPosts`, `SearchProducts`    |
| Mutation     | `CreateUser`, `UpdatePost`, `DeleteComment` |
| Subscription | `OnMessageReceived`, `OnUserStatusChanged`  |

### Variable Syntax

```graphql
# Required variable
query GetUser($id: ID!) { ... }

# Optional variable with default
query ListPosts($first: Int = 20) { ... }

# Multiple variables
query SearchPosts($query: String!, $status: PostStatus, $first: Int = 10) { ... }
```

### Fragment Syntax

```graphql
# Define fragment
fragment UserBasicInfo on User {
  id
  name
  avatarUrl
}

# Use fragment
query GetUser($id: ID!) {
  user(id: $id) {
    ...UserBasicInfo
    email
  }
}
```

### Directives

```graphql
query GetUser($id: ID!, $includeEmail: Boolean!) {
  user(id: $id) {
    id
    name
    email @include(if: $includeEmail)
  }
}

query GetPosts($skipDrafts: Boolean!) {
  posts {
    id
    title
    draft @skip(if: $skipDrafts)
  }
}
```

## Key Principles

### 1. Request Only What You Need

```graphql
# Good: Specific fields
query GetUserName($id: ID!) {
  user(id: $id) {
    id
    name
  }
}

# Avoid: Over-fetching
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    bio
    posts {
      id
      title
      content
      comments {
        id
      }
    }
    followers {
      id
      name
    }
    # ... many unused fields
  }
}
```

### 2. Name All Operations

```graphql
# Good: Named operation
query GetUserPosts($userId: ID!) {
  user(id: $userId) {
    posts {
      id
      title
    }
  }
}

# Avoid: Anonymous operation
query {
  user(id: "123") {
    posts {
      id
      title
    }
  }
}
```

### 3. Use Variables, Not Inline Values

```graphql
# Good: Variables
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
  }
}

# Avoid: Hardcoded values
query {
  user(id: "123") {
    id
    name
  }
}
```

### 4. Colocate Fragments with Components

```tsx
// UserAvatar.tsx
export const USER_AVATAR_FRAGMENT = gql`
  fragment UserAvatar on User {
    id
    name
    avatarUrl
  }
`;

function UserAvatar({ user }) {
  return <img src={user.avatarUrl} alt={user.name} />;
}
```

## Siraj Codebase GraphQL Conventions (CRITICAL)

In this project, adhere strictly to these rules:

1. **Document Location & Naming**:
   - Documents live in `frontend/common/graphql/sharedDocuments/<domain>/<name>.documents.ts`.
   - Naming convention: `{entityName}QueryDocument`, `{entityName}MutationDocument`.
2. **Apollo Cache Normalization**:
   - **Always include `id` field** on every object type returned by queries and mutations.
3. **No `useLazyQuery`**:
   - **`useLazyQuery` is prohibited.** Use stateful `useQuery` with `skip: !condition` exclusively.
4. **Code Generation Workflow**:
   - After editing Pothos schema: `bun run generate:gqlSchema`
   - After modifying or adding GraphQL documents: `bun codegen`
5. **Importing Hooks**:
   - Import hooks from `"@apollo/client/react"`, not `"@apollo/client"`.

## Reference Files

Detailed documentation for specific topics:

- [Queries](references/queries.md) - Query patterns and optimization
- [Mutations](references/mutations.md) - Mutation patterns and error handling
- [Fragments](references/fragments.md) - Fragment organization and reuse
- [Variables](references/variables.md) - Variable usage and types
- [Tooling](references/tooling.md) - Code generation and linting

## Ground Rules

- ALWAYS place operations in `frontend/common/graphql/sharedDocuments/<domain>/`
- ALWAYS name documents `{entityName}QueryDocument` or `{entityName}MutationDocument`
- ALWAYS include `id` field for cacheable types
- ALWAYS use `useQuery` (NEVER `useLazyQuery`)
- ALWAYS run `bun run generate:gqlSchema` and `bun codegen` after schema/document changes
- ALWAYS use variables for dynamic values (never inline literals)
- PREFER fragments for reusable field selections

