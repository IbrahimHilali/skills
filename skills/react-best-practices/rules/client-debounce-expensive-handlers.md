---
title: Debounce or Throttle Expensive Event Handlers
impact: MEDIUM
impactDescription: cuts handler invocations by 10-100x on high-frequency events
tags: client, debounce, throttle, performance, scroll, input
---

## Debounce or Throttle Expensive Event Handlers

`scroll`, `resize`, and `input` events can fire dozens of times per second.
Running an expensive handler (a network request, a heavy computation, a
large state update) on every single event wastes work the user never
perceives. Debounce handlers that only need the final value (search-as-you-type)
and throttle handlers that need periodic updates during the interaction
(scroll position tracking).

**Incorrect (fires a request on every keystroke):**

```typescript
function SearchInput() {
  const [results, setResults] = useState([])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    fetchResults(e.target.value).then(setResults) // one request per keystroke
  }

  return <input onChange={handleChange} />
}
```

**Correct (debounced — waits for typing to pause):**

```typescript
function SearchInput() {
  const [results, setResults] = useState([])

  const debouncedFetch = useMemo(
    () => debounce((query: string) => fetchResults(query).then(setResults), 300),
    [],
  )

  return <input onChange={(e) => debouncedFetch(e.target.value)} />
}
```

**Correct (throttled — runs at most once per interval during scroll):**

```typescript
function ScrollTracker() {
  useEffect(() => {
    const handleScroll = throttle(() => {
      trackScrollDepth(window.scrollY)
    }, 200)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return null
}
```

Use debounce when only the final value after activity stops matters. Use
throttle when you need updates *during* continuous activity, just not on
every single event. Pair with `client-passive-event-listeners` for scroll
and touch handlers.

Reference: [CSS-Tricks - Debouncing and Throttling](https://css-tricks.com/debouncing-throttling-explained-examples/)
