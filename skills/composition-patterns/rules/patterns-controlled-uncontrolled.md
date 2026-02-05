---
title: Support Both Controlled and Uncontrolled Usage
impact: MEDIUM
impactDescription: one component API serves both simple and externally-synced use cases
tags: composition, controlled, uncontrolled, patterns
---

## Support Both Controlled and Uncontrolled Usage

Don't force every consumer to manage state externally (controlled-only) or
force every consumer to read state via refs/callbacks (uncontrolled-only).
Support both: use internal state by default, but let a consumer take over
by passing `value`/`onChange`—the same pattern native inputs use.

**Incorrect (controlled-only forces boilerplate on simple usage):**

```tsx
function Composer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return <TextInput value={value} onChangeText={onChange} />
}

// Every consumer needs its own useState, even for the simple case
function SimpleComposer() {
  const [value, setValue] = useState('')
  return <Composer value={value} onChange={setValue} />
}
```

**Correct (works uncontrolled by default, controllable when needed):**

```tsx
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : uncontrolled

  const setValue = (next: T) => {
    if (!isControlled) setUncontrolled(next)
    onChange?.(next)
  }

  return [current, setValue] as const
}

function Composer({
  value,
  defaultValue = '',
  onChange,
}: {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
}) {
  const [input, setInput] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  return <TextInput value={input} onChangeText={setInput} />
}
```

**Usage:**

```tsx
// Uncontrolled — no external state needed
<Composer defaultValue="" onChange={trackDraft} />

// Controlled — parent owns the value (e.g. synced across tabs)
<Composer value={draft} onChange={setDraft} />
```

This mirrors how native `<input>` works, so it's a familiar API for
consumers, and it avoids forcing every use case through the more complex
provider pattern (see `state-lift-state`) when a component's state doesn't
need to be shared with siblings.

Reference: [React - Controlled and Uncontrolled Components](https://react.dev/learn/sharing-state-between-components)
