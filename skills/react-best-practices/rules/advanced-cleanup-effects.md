---
title: Clean Up Effects to Prevent Leaks
impact: MEDIUM
impactDescription: prevents memory growth and stale updates from accumulating across mounts
tags: advanced, effects, cleanup, memory-leaks
---

## Clean Up Effects to Prevent Leaks

An effect that subscribes, sets a timer, or opens a connection without
returning a cleanup function keeps that resource alive after the component
unmounts (or after the effect re-runs). Over time—especially in
long-lived SPAs or components that mount/unmount frequently (list items,
modals, tabs)—these accumulate into memory growth and updates firing against
unmounted state.

**Incorrect (no cleanup — listener and timer outlive the component):**

```tsx
function LiveIndicator({ channelId }: { channelId: string }) {
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const socket = subscribeToChannel(channelId, (s) => setStatus(s))
    const interval = setInterval(() => socket.ping(), 5000)
    // no return — socket and interval keep running after unmount
  }, [channelId])

  return <Badge status={status} />
}
```

**Correct (cleanup tears down everything the effect created):**

```tsx
function LiveIndicator({ channelId }: { channelId: string }) {
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const socket = subscribeToChannel(channelId, (s) => setStatus(s))
    const interval = setInterval(() => socket.ping(), 5000)

    return () => {
      clearInterval(interval)
      socket.unsubscribe()
    }
  }, [channelId])

  return <Badge status={status} />
}
```

Every subscription, timer, listener, or connection created inside an effect
needs a matching teardown in its cleanup function. This matters most for
components that mount and unmount often (list rows, tabs, modals)—without
cleanup, each mount adds another live subscription that never goes away.

Reference: [React - Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects#cleanup-function)
