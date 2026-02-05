---
title: Batch N+1 Fetches Instead of Looping
impact: CRITICAL
impactDescription: turns N sequential/parallel round trips into 1
tags: async, n-plus-one, batching, dataloader
---

## Batch N+1 Fetches Instead of Looping

Fetching related data per item in a loop—even in parallel with
`Promise.all`—still issues N separate network or database round trips for N
items. Batch the lookups into a single request that fetches all of them at
once (a `WHERE id IN (...)` query, a bulk endpoint, or a DataLoader-style
per-tick batcher).

**Incorrect (N requests, even though parallelized):**

```typescript
async function getPostsWithAuthors(postIds: string[]) {
  const posts = await db.posts.findMany({ where: { id: { in: postIds } } })

  // N+1: one query per post to fetch its author
  const withAuthors = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      author: await db.users.findUnique({ where: { id: post.authorId } }),
    })),
  )

  return withAuthors
}
```

**Correct (1 batched query for all authors):**

```typescript
async function getPostsWithAuthors(postIds: string[]) {
  const posts = await db.posts.findMany({ where: { id: { in: postIds } } })

  const authorIds = [...new Set(posts.map((p) => p.authorId))]
  const authors = await db.users.findMany({ where: { id: { in: authorIds } } })
  const authorsById = new Map(authors.map((a) => [a.id, a]))

  return posts.map((post) => ({
    ...post,
    author: authorsById.get(post.authorId),
  }))
}
```

For cases where the batching boundary isn't a single function (e.g. a GraphQL
resolver called once per item by the framework), use a per-tick batching
utility like DataLoader, which collects individual `.load(id)` calls made
within the same microtask and issues one batched query for all of them.

Reference: [DataLoader](https://github.com/graphql/dataloader)
