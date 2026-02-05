---
title: Virtualize Long Lists
impact: HIGH
impactDescription: renders only visible rows instead of thousands of DOM nodes
tags: rendering, virtualization, long-lists, performance
---

## Virtualize Long Lists

Rendering thousands of DOM nodes for a long list is slow to mount and slow
to update, even with `content-visibility` deferring paint (see
`rendering-content-visibility`)—the nodes still exist in the DOM and React's
tree. For lists that can grow into the hundreds or thousands, render only
the rows currently in (or near) the viewport with a virtualization library.

**Incorrect (mounts every row regardless of list size):**

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map((msg) => (
        <MessageRow key={msg.id} message={msg} />
      ))}
    </div>
  )
}
// 10,000 messages = 10,000 mounted DOM nodes, even though ~20 are visible
```

**Correct (only visible rows are mounted):**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  })

  return (
    <div ref={parentRef} className="overflow-y-auto h-screen">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${row.start}px)`,
              width: '100%',
            }}
          >
            <MessageRow message={messages[row.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

For 10,000 messages, only the ~20 rows near the viewport are mounted at any
time—scrolling stays smooth regardless of list size. Reach for this once a
list can realistically exceed a few hundred items; `content-visibility` is
enough for shorter lists and needs no library.

Reference: [TanStack Virtual](https://tanstack.com/virtual/latest)
