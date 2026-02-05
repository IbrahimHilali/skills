---
title: Use Discriminated Unions Instead of Optional Prop Combinations
impact: MEDIUM
impactDescription: makes impossible prop combinations unrepresentable at the type level
tags: composition, typescript, discriminated-union, patterns
---

## Use Discriminated Unions Instead of Optional Prop Combinations

When a single component genuinely needs to serve a few mutually exclusive
modes—and splitting into separate components (see `patterns-explicit-variants`)
isn't worth it—type the props as a discriminated union instead of a bag of
optional props. This makes invalid combinations a compile error instead of a
runtime check.

**Incorrect (optional props allow impossible combinations):**

```tsx
interface ComposerProps {
  variant: 'thread' | 'edit' | 'forward'
  channelId?: string // only valid when variant === 'thread'
  messageId?: string // only valid when variant === 'edit' | 'forward'
}

// Nothing stops this from compiling, even though it's meaningless:
<Composer variant="thread" messageId="123" />
```

**Correct (discriminated union makes invalid states unrepresentable):**

```tsx
type ComposerProps =
  | { variant: 'thread'; channelId: string }
  | { variant: 'edit'; messageId: string }
  | { variant: 'forward'; messageId: string }

function Composer(props: ComposerProps) {
  switch (props.variant) {
    case 'thread':
      // props.channelId is available and typed; props.messageId doesn't exist
      return <ThreadComposerBody channelId={props.channelId} />
    case 'edit':
      return <EditComposerBody messageId={props.messageId} />
    case 'forward':
      return <ForwardComposerBody messageId={props.messageId} />
  }
}

// This is now a type error, not a silent runtime bug:
// <Composer variant="thread" messageId="123" />
```

Prefer separate explicit-variant components (`ThreadComposer`,
`EditComposer`) when each mode's rendered structure genuinely differs—that
keeps each component simple and independently readable. Reach for a
discriminated union only when the modes share almost all their rendering and
differ only in a couple of typed fields, so a single component with a
`switch` is clearer than three near-identical wrapper components.

Reference: [TypeScript - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
