---
title: Stream Large Responses Instead of Buffering
impact: MEDIUM-HIGH
impactDescription: reduces time-to-first-byte for large or slow-to-produce payloads
tags: server, streaming, ttfb, api-routes
---

## Stream Large Responses Instead of Buffering

Don't build a full response in memory before sending it when the data is
large or produced incrementally (LLM tokens, DB cursors, large exports). The
client waits for the entire payload before seeing anything. Stream chunks as
they become available instead.

**Incorrect (buffers everything before responding):**

```typescript
export async function GET(request: Request) {
  const rows = await db.query('SELECT * FROM events') // waits for all rows
  const csv = rows.map(rowToCsv).join('\n') // builds entire string in memory
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv' },
  })
}
```

**Correct (streams chunks as they're produced):**

```typescript
export async function GET(request: Request) {
  const cursor = db.queryCursor('SELECT * FROM events')

  const stream = new ReadableStream({
    async pull(controller) {
      const row = await cursor.next()
      if (row === null) {
        controller.close()
        return
      }
      controller.enqueue(new TextEncoder().encode(rowToCsv(row) + '\n'))
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/csv' },
  })
}
```

The client starts receiving and processing rows immediately instead of
waiting for the full query and full serialization to finish. This is the
same principle behind `async-suspense-boundaries` for RSC—stream content
as it becomes ready rather than waiting for all of it.

Reference: [MDN - Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
