---
title: Merge Forwarded Refs with Internal Refs
impact: LOW
impactDescription: lets a component expose its ref to consumers without losing its own internal ref
tags: composition, refs, patterns
---

## Merge Forwarded Refs with Internal Refs

A compound component subcomponent often needs its own ref internally (for
focus management, measuring, etc.) while also accepting a `ref` prop from
the consumer. Don't drop one in favor of the other—merge them so both work.

**Incorrect (consumer's ref overwrites the internal one, or vice versa):**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  // Internal focus-management code needs a ref, but this component
  // only has the consumer's ref, or only its own—never both
  return <TextInput ref={ref} {...props} />
}

function useAutoFocusOnMount(inputRef: React.RefObject<TextInput>) {
  useEffect(() => {
    inputRef.current?.focus()
  }, [inputRef])
}
```

**Correct (mergeRefs combines both into one ref callback):**

```tsx
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref && 'current' in ref) (ref as React.RefObject<T>).current = node
    }
  }
}

function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  const internalRef = useRef<TextInput>(null)
  useAutoFocusOnMount(internalRef)

  return <TextInput ref={mergeRefs(internalRef, ref)} {...props} />
}
```

Both the component's own internal ref logic (focus, measuring, scrolling)
and the consumer's forwarded ref (imperative access from outside) keep
working, regardless of which one is passed.

Reference: [React - Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
