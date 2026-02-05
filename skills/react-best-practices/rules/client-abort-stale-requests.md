---
title: Abort Stale Requests on Param Change
impact: MEDIUM-HIGH
impactDescription: prevents race conditions where an outdated response overwrites newer state
tags: client, fetch, abortcontroller, race-condition
---

## Abort Stale Requests on Param Change

When a fetch is triggered by fast-changing input (a search box, a tab
switch, pagination), an earlier slow request can resolve *after* a later
one and overwrite the UI with stale data—and the browser is still spending
bandwidth and CPU on a response nobody needs anymore. Cancel the previous
request with `AbortController` whenever a new one starts.

**Incorrect (no cancellation — a slow, stale response can win the race):**

```typescript
function useSearchResults(query: string) {
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((res) => res.json())
      .then(setResults) // may resolve out of order for a fast-changing query
  }, [query])

  return results
}
```

**Correct (aborts the in-flight request when the query changes or unmounts):**

```typescript
function useSearchResults(query: string) {
  const [results, setResults] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== 'AbortError') throw err
      })

    return () => controller.abort()
  }, [query])

  return results
}
```

Every keystroke cancels the previous in-flight request, so only the latest
one can ever update state—eliminating the race condition and the wasted
network/CPU work on responses that would be thrown away anyway. Most data
libraries (SWR, React Query, `fetch` itself) support passing an
`AbortSignal` through to the underlying request.

Reference: [MDN - AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
