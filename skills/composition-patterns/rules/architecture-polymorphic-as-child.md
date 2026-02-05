---
title: Use asChild for Polymorphic Rendering
impact: MEDIUM
impactDescription: avoids boolean/string "as" props while keeping behavior composable
tags: composition, polymorphic, architecture
---

## Use asChild for Polymorphic Rendering

When a component needs to render as a different element or component while
keeping its behavior (styles, ARIA attributes, handlers), don't add an `as`
prop that switches on strings or a pile of booleans. Use an `asChild` prop
that merges the component's props onto its child via `cloneElement`.

**Incorrect (string/boolean `as` prop branching):**

```tsx
function Button({
  as = 'button',
  href,
  children,
  ...props
}: {
  as?: 'button' | 'a' | 'link'
  href?: string
  children: React.ReactNode
}) {
  if (as === 'a') {
    return (
      <a href={href} className='btn' {...props}>
        {children}
      </a>
    )
  }
  if (as === 'link') {
    return (
      <Link href={href!} className='btn' {...props}>
        {children}
      </Link>
    )
  }
  return (
    <button className='btn' {...props}>
      {children}
    </button>
  )
}
```

**Correct (asChild merges behavior onto the child element):**

```tsx
function Button({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean
  children: React.ReactNode
} & React.ComponentProps<'button'>) {
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn('btn', children.props.className),
      ...props,
    })
  }
  return (
    <button className='btn' {...props}>
      {children}
    </button>
  )
}
```

**Usage:**

```tsx
// Renders a native button
<Button onPress={submit}>Send</Button>

// Renders as a Link, but keeps Button's styles/behavior
<Button asChild>
  <Link href="/settings">Settings</Link>
</Button>
```

The component doesn't need to know about every possible target element—`asChild`
lets consumers compose it onto anything while the component only manages its own
concerns (styling, behavior, accessibility attributes).

Reference: [Radix UI - asChild](https://www.radix-ui.com/primitives/docs/guides/composition)
