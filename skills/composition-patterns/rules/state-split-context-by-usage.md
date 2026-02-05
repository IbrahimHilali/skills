---
title: Split Context by Update Frequency
impact: MEDIUM
impactDescription: prevents action-only consumers from re-rendering on every state change
tags: composition, state, context, performance
---

## Split Context by Update Frequency

Don't bundle frequently-changing state and rarely-changing actions into a
single context value. Every consumer of that context re-renders whenever
*any* part of the value changes—even a `ForwardButton` that only calls
`actions.submit` and never reads `state.input`.

Split the context into a state context and a stable actions context so
components only subscribe to what actually changes.

**Incorrect (one context, unnecessary re-renders):**

```tsx
const ComposerContext = createContext<{
  state: ComposerState
  actions: ComposerActions
} | null>(null)

function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const actions = useMemo(
    () => ({ update: setState, submit: () => submitMessage(state) }),
    [state],
  )
  // actions is recreated every time state changes, so ForwardButton
  // re-renders on every keystroke even though it only needs `submit`
  return (
    <ComposerContext value={{ state, actions }}>{children}</ComposerContext>
  )
}

function ForwardButton() {
  const { actions } = use(ComposerContext)
  return <Button onPress={actions.submit}>Forward</Button>
}
```

**Correct (separate state and actions contexts):**

```tsx
const ComposerStateContext = createContext<ComposerState | null>(null)
const ComposerActionsContext = createContext<ComposerActions | null>(null)

function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Stable across renders: doesn't depend on `state` directly
  const actions = useMemo(
    () => ({
      update: setState,
      submit: () => submitMessage(stateRef.current),
    }),
    [],
  )

  return (
    <ComposerActionsContext value={actions}>
      <ComposerStateContext value={state}>{children}</ComposerStateContext>
    </ComposerActionsContext>
  )
}

function ForwardButton() {
  // Only subscribes to actions—never re-renders when state changes
  const { submit } = use(ComposerActionsContext)!
  return <Button onPress={submit}>Forward</Button>
}

function ComposerInput() {
  const state = use(ComposerStateContext)!
  const { update } = use(ComposerActionsContext)!
  return (
    <TextInput
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}
```

Consumers that only dispatch actions (buttons, menu items) never re-render
when state changes. Consumers that read state only re-render when the state
they actually use changes.

Reference: [Kent C. Dodds - How to optimize your context value](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
