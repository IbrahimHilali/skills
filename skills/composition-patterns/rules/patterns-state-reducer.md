---
title: State Reducer and Prop Getters for Deep Customization
impact: MEDIUM
impactDescription: lets consumers override internal state transitions without forking the component
tags: composition, state-reducer, prop-getters, patterns
---

## State Reducer and Prop Getters for Deep Customization

When a swappable provider (see `state-decouple-implementation`) isn't
flexible enough—because a consumer needs to override *one specific*
internal state transition, not the whole state implementation—expose a
`stateReducer` prop that lets the consumer intercept and modify state
changes before they're applied. Pair it with prop getters so consumers can
merge their own handlers into internal ones without clobbering them.

**Incorrect (consumer forks the whole provider to change one transition):**

```tsx
// Needing to prevent submit while attachments are uploading means
// copy-pasting the entire provider just to change one branch
function ChannelProviderWithUploadGuard({ channelId, children }) {
  const [state, setState] = useState(initialState)
  const submit = () => {
    if (state.attachments.some((a) => a.uploading)) return
    submitMessage(channelId, state)
  }
  return (
    <Composer.Provider state={state} actions={{ update: setState, submit }}>
      {children}
    </Composer.Provider>
  )
}
```

**Correct (stateReducer lets consumers intercept transitions):**

```tsx
type ComposerAction =
  | { type: 'update'; input: string }
  | { type: 'submit' }

function defaultReducer(state: ComposerState, action: ComposerAction) {
  switch (action.type) {
    case 'update':
      return { ...state, input: action.input }
    case 'submit':
      return { ...state, isSubmitting: true }
  }
}

function useComposerState({
  stateReducer = defaultReducer,
}: {
  stateReducer?: (state: ComposerState, action: ComposerAction) => ComposerState
} = {}) {
  const [state, dispatch] = useReducer(
    (state: ComposerState, action: ComposerAction) =>
      stateReducer(state, action),
    initialState,
  )
  return { state, dispatch }
}

// Consumer overrides just the submit transition
function ChannelComposer({ channelId }: { channelId: string }) {
  const { state, dispatch } = useComposerState({
    stateReducer: (state, action) => {
      if (action.type === 'submit' && state.attachments.some((a) => a.uploading)) {
        return state // block the transition
      }
      return defaultReducer(state, action)
    },
  })
  // ...
}
```

**Prop getters merge consumer handlers with internal ones:**

```tsx
function getInputProps({ onChange, ...rest } = {}) {
  return {
    value: state.input,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'update', input: e.target.value })
      onChange?.(e) // consumer's handler still runs
    },
    ...rest,
  }
}

// Usage: consumer's onChange composes with internal logic instead of replacing it
<input {...getInputProps({ onChange: trackAnalytics })} />
```

Reserve this pattern for library-grade components with external consumers who
need to override specific behavior. For app-internal components, an explicit
variant (see `patterns-explicit-variants`) is usually simpler.

Reference: [Kent C. Dodds - The State Reducer Pattern](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks)
