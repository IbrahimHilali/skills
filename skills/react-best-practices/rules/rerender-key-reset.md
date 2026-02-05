---
title: Use key to Reset Component State
impact: MEDIUM
impactDescription: replaces manual reset effects with a single prop
tags: rerender, key, state-reset
---

## Use key to Reset Component State

When a component's internal state needs to fully reset whenever some
identifier changes (switching between editing different records, moving to
a different chat thread), don't add a `useEffect` that manually resets every
piece of state. Change the component's `key`—React unmounts the old
instance and mounts a fresh one, resetting all state for free.

**Incorrect (manual reset effect, easy to miss a field):**

```tsx
function ProfileEditor({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)

  useEffect(() => {
    // Have to remember to reset every field here, every time one is added
    setName('')
    setBio('')
    setAvatar(null)
  }, [userId])

  // ...
}
```

**Correct (key change remounts the component, resetting everything):**

```tsx
function ProfileEditor({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  // No reset effect needed — a fresh userId means a fresh component instance
  // ...
}

function ProfilePage({ userId }: { userId: string }) {
  return <ProfileEditor key={userId} userId={userId} />
}
```

This also avoids the extra render that the effect-based approach causes
(mount with stale state, then an effect fires to reset it)—the new instance
mounts with correct initial state on the first render. Reach for this when
state should reset entirely; use `rerender-derived-state-no-effect` instead
when only some derived value needs to track a prop.

Reference: [React - Resetting state with a key](https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key)
