---
title: Guard Context Access with a Custom Hook
impact: MEDIUM
impactDescription: turns "cannot read property of null" into a clear, actionable error at the usage site
tags: composition, context, state, error-handling
---

## Guard Context Access with a Custom Hook

Don't export a raw context and let every subcomponent call `use(ComposerContext)`
directly. If a consumer renders a subcomponent outside its provider, they get
`null` and then a confusing `Cannot read properties of null` a few lines
later—far from the actual mistake. Wrap context access in a custom hook that
throws a clear error immediately.

**Incorrect (raw context access, unclear failure downstream):**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function ComposerInput() {
  const { state, actions } = use(ComposerContext) // could be null
  // Crashes here with "Cannot read properties of null (reading 'state')"
  // if rendered outside <Composer.Provider>
  return <TextInput value={state.input} onChangeText={actions.update} />
}
```

**Correct (custom hook fails fast with a clear message):**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function useComposerContext() {
  const context = use(ComposerContext)
  if (context === null) {
    throw new Error(
      'Composer subcomponents must be rendered inside <Composer.Provider>',
    )
  }
  return context
}

function ComposerInput() {
  const { state, actions } = useComposerContext()
  return <TextInput value={state.input} onChangeText={actions.update} />
}
```

The error now points directly at the missing provider instead of a
downstream property access, and every subcomponent gets this check for
free by using the hook instead of the raw context.

Reference: [Kent C. Dodds - How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
