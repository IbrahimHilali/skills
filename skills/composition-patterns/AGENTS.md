# React Composition Patterns

**Version 1.0.0**  
January 2026

> **Note:**  
> This document is mainly for agents and LLMs to follow when maintaining,
> generating, or refactoring React codebases using composition. Humans
> may also find it useful, but guidance here is optimized for automation
> and consistency by AI-assisted workflows.

---

## Abstract

Composition patterns for building flexible, maintainable React components. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals. These patterns make codebases easier for both humans and AI agents to work with as they scale.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture) — **HIGH**
   - 1.1 [Avoid Boolean Prop Proliferation](#11-avoid-boolean-prop-proliferation)
   - 1.2 [Prefer Custom Hooks Over Higher-Order Components](#12-prefer-custom-hooks-over-higher-order-components)
   - 1.3 [Separate Behavior from Presentation with Headless Components](#13-separate-behavior-from-presentation-with-headless-components)
   - 1.4 [Use asChild for Polymorphic Rendering](#14-use-aschild-for-polymorphic-rendering)
   - 1.5 [Use Compound Components](#15-use-compound-components)
2. [State Management](#2-state-management) — **MEDIUM**
   - 2.1 [Decouple State Management from UI](#21-decouple-state-management-from-ui)
   - 2.2 [Define Generic Context Interfaces for Dependency Injection](#22-define-generic-context-interfaces-for-dependency-injection)
   - 2.3 [Guard Context Access with a Custom Hook](#23-guard-context-access-with-a-custom-hook)
   - 2.4 [Lift State into Provider Components](#24-lift-state-into-provider-components)
   - 2.5 [Split Context by Update Frequency](#25-split-context-by-update-frequency)
3. [Implementation Patterns](#3-implementation-patterns) — **MEDIUM**
   - 3.1 [Create Explicit Component Variants](#31-create-explicit-component-variants)
   - 3.2 [Merge Forwarded Refs with Internal Refs](#32-merge-forwarded-refs-with-internal-refs)
   - 3.3 [Prefer Composing Children Over Render Props](#33-prefer-composing-children-over-render-props)
   - 3.4 [State Reducer and Prop Getters for Deep Customization](#34-state-reducer-and-prop-getters-for-deep-customization)
   - 3.5 [Support Both Controlled and Uncontrolled Usage](#35-support-both-controlled-and-uncontrolled-usage)
   - 3.6 [Use Discriminated Unions Instead of Optional Prop Combinations](#36-use-discriminated-unions-instead-of-optional-prop-combinations)
4. [React 19 APIs](#4-react-19-apis) — **MEDIUM**
   - 4.1 [React 19 API Changes](#41-react-19-api-changes)

---

## 1. Component Architecture

**Impact: HIGH**

Fundamental patterns for structuring components to avoid prop

### 1.1 Avoid Boolean Prop Proliferation

**Impact: CRITICAL (prevents unmaintainable component variants)**

Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize
component behavior. Each boolean doubles possible states and creates
unmaintainable conditional logic. Use composition instead.

**Incorrect (boolean props create exponential complexity):**

```tsx
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header />
      <Input />
      {isDMThread ? (
        <AlsoSendToDMField id={dmId} />
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} />
      ) : null}
      {isEditing ? (
        <EditActions />
      ) : isForwarding ? (
        <ForwardActions />
      ) : (
        <DefaultActions />
      )}
      <Footer onSubmit={onSubmit} />
    </form>
  )
}
```

**Correct (composition eliminates conditionals):**

```tsx
// Channel composer
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Thread composer - adds "also send to channel" field
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <AlsoSendToChannelField id={channelId} />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Edit composer - different footer actions
function EditComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.CancelEdit />
        <Composer.SaveEdit />
      </Composer.Footer>
    </Composer.Frame>
  )
}
```

Each variant is explicit about what it renders. We can share internals without
sharing a single monolithic parent.

### 1.2 Prefer Custom Hooks Over Higher-Order Components

**Impact: HIGH (avoids wrapper hell and prop-name collisions from stacked HOCs)**

Don't wrap components in higher-order components (`withAuth(withTheme(withData(Component)))`)
to share behavior. Each HOC adds a wrapper in the tree, obscures prop
sources (which HOC injected `user`? which injected `theme`?), and stacking
several creates "wrapper hell" that's hard to trace in DevTools. Extract the
shared behavior into a custom hook instead—it shares logic without adding
component layers.

**Incorrect (stacked HOCs, unclear prop origin):**

```tsx
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const user = useCurrentUser()
    if (!user) return <LoginPrompt />
    return <Component {...props} user={user} />
  }
}

function withTheme(Component) {
  return function ThemedComponent(props) {
    const theme = useContext(ThemeContext)
    return <Component {...props} theme={theme} />
  }
}

// Where does `user` come from? Where does `theme` come from?
// The tree now has two extra wrapper components too.
export default withAuth(withTheme(ProfilePage))
```

**Correct (custom hooks, explicit at the call site):**

```tsx
function useAuth() {
  const user = useCurrentUser()
  return user
}

function useTheme() {
  return useContext(ThemeContext)
}

function ProfilePage() {
  const user = useAuth()
  const theme = useTheme()

  if (!user) return <LoginPrompt />

  return <div className={theme.className}>{/* ... */}</div>
}
```

The component's dependencies are visible directly in its body—no wrapper
components, no guessing which HOC injected which prop, no prop-name
collisions when two HOCs both try to inject a `data` prop.

**When a HOC is still appropriate:** wrapping a component whose entire
render output needs replacing (e.g. `withErrorBoundary`, which needs a class
component and can't be expressed as a hook since hooks can't catch render
errors).

Reference: [React - Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### 1.3 Separate Behavior from Presentation with Headless Components

**Impact: HIGH (the same interaction logic renders completely different UIs without duplication)**

When a component's interaction logic (open/close state, keyboard navigation,
selection, positioning) needs to render as visually different UIs—a
dropdown here, a bottom sheet there, a different design system in another
app—don't duplicate that logic per UI. Extract it into a "headless" hook
that returns state and handlers, with zero markup of its own. Each consumer
supplies its own presentation.

**Incorrect (logic duplicated across differently-styled dropdowns):**

```tsx
function DesktopDropdown({ options }: { options: Option[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Option | null>(null)
  // keyboard nav, outside-click handling, etc. duplicated here
  return <div className="desktop-dropdown">{/* ... */}</div>
}

function MobileBottomSheet({ options }: { options: Option[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Option | null>(null)
  // the exact same logic, copy-pasted, for a totally different UI
  return <div className="mobile-sheet">{/* ... */}</div>
}
```

**Correct (one headless hook, two presentations):**

```tsx
function useSelect(options: Option[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Option | null>(null)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const select = (option: Option) => {
    setSelected(option)
    close()
  }

  return { isOpen, selected, options, open, close, select }
}

function DesktopDropdown({ options }: { options: Option[] }) {
  const { isOpen, selected, open, close, select } = useSelect(options)
  return (
    <div className="desktop-dropdown">
      <button onClick={open}>{selected?.label ?? 'Select...'}</button>
      {isOpen && (
        <ul onMouseLeave={close}>
          {options.map((o) => (
            <li key={o.id} onClick={() => select(o)}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MobileBottomSheet({ options }: { options: Option[] }) {
  const { isOpen, selected, open, close, select } = useSelect(options)
  return (
    <div className="mobile-sheet">
      <button onClick={open}>{selected?.label ?? 'Select...'}</button>
      {isOpen && (
        <Sheet onDismiss={close}>
          {options.map((o) => (
            <SheetRow key={o.id} onPress={() => select(o)}>
              {o.label}
            </SheetRow>
          ))}
        </Sheet>
      )}
    </div>
  )
}
```

The interaction logic (`useSelect`) is tested and maintained once. Each
presentation is a thin rendering layer with no behavior of its own to get
out of sync. This is the same "decouple state from UI" principle as a
provider (see `state-decouple-implementation`), applied via a hook instead
of a context when there's no need to share state across sibling
components.

Reference: [Reach UI / Headless UI - the headless component pattern](https://www.merrickchristensen.com/articles/headless-user-interface-components/)

### 1.4 Use asChild for Polymorphic Rendering

**Impact: MEDIUM (avoids boolean/string "as" props while keeping behavior composable)**

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

### 1.5 Use Compound Components

**Impact: HIGH (enables flexible composition without prop drilling)**

Structure complex components as compound components with a shared context. Each
subcomponent accesses shared state via context, not props. Consumers compose the
pieces they need.

**Incorrect (monolithic component with render props):**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
  showAttachments,
  showFormatting,
  showEmojis,
}: Props) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {showAttachments && <Attachments />}
      {renderFooter ? (
        renderFooter()
      ) : (
        <Footer>
          {showFormatting && <Formatting />}
          {showEmojis && <Emojis />}
          {renderActions?.()}
        </Footer>
      )}
    </form>
  )
}
```

**Correct (compound components with shared context):**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function ComposerProvider({ children, state, actions, meta }: ProviderProps) {
  return (
    <ComposerContext value={{ state, actions, meta }}>
      {children}
    </ComposerContext>
  )
}

function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}</form>
}

function ComposerInput() {
  const {
    state,
    actions: { update },
    meta: { inputRef },
  } = use(ComposerContext)
  return (
    <TextInput
      ref={inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}

function ComposerSubmit() {
  const {
    actions: { submit },
  } = use(ComposerContext)
  return <Button onPress={submit}>Send</Button>
}

// Export as compound component
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
  Attachments: ComposerAttachments,
  Formatting: ComposerFormatting,
  Emojis: ComposerEmojis,
}
```

**Usage:**

```tsx
<Composer.Provider state={state} actions={actions} meta={meta}>
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Submit />
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

Consumers explicitly compose exactly what they need. No hidden conditionals. And the state, actions and meta are dependency-injected by a parent provider, allowing multiple usages of the same component structure.

---

## 2. State Management

**Impact: MEDIUM**

Patterns for lifting state and managing shared context across

### 2.1 Decouple State Management from UI

**Impact: MEDIUM (enables swapping state implementations without changing UI)**

The provider component should be the only place that knows how state is managed.
UI components consume the context interface—they don't know if state comes from
useState, Zustand, or a server sync.

**Incorrect (UI coupled to state implementation):**

```tsx
function ChannelComposer({ channelId }: { channelId: string }) {
  // UI component knows about global state implementation
  const state = useGlobalChannelState(channelId)
  const { submit, updateInput } = useChannelSync(channelId)

  return (
    <Composer.Frame>
      <Composer.Input
        value={state.input}
        onChange={(text) => sync.updateInput(text)}
      />
      <Composer.Submit onPress={() => sync.submit()} />
    </Composer.Frame>
  )
}
```

**Correct (state management isolated in provider):**

```tsx
// Provider handles all state management details
function ChannelProvider({
  channelId,
  children,
}: {
  channelId: string
  children: React.ReactNode
}) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  )
}

// UI component only knows about the context interface
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Usage
function Channel({ channelId }: { channelId: string }) {
  return (
    <ChannelProvider channelId={channelId}>
      <ChannelComposer />
    </ChannelProvider>
  )
}
```

**Different providers, same UI:**

```tsx
// Local state for ephemeral forms
function ForwardMessageProvider({ children }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
    >
      {children}
    </Composer.Provider>
  )
}

// Global synced state for channels
function ChannelProvider({ channelId, children }) {
  const { state, update, submit } = useGlobalChannel(channelId)

  return (
    <Composer.Provider state={state} actions={{ update, submit }}>
      {children}
    </Composer.Provider>
  )
}
```

The same `Composer.Input` component works with both providers because it only
depends on the context interface, not the implementation.

### 2.2 Define Generic Context Interfaces for Dependency Injection

**Impact: HIGH (enables dependency-injectable state across use-cases)**

Define a **generic interface** for your component context with three parts:
`state`, `actions`, and `meta`. This interface is a contract that any provider
can implement—enabling the same UI components to work with completely different
state implementations.

**Core principle:** Lift state, compose internals, make state
dependency-injectable.

**Incorrect (UI coupled to specific state implementation):**

```tsx
function ComposerInput() {
  // Tightly coupled to a specific hook
  const { input, setInput } = useChannelComposerState()
  return <TextInput value={input} onChangeText={setInput} />
}
```

**Correct (generic interface enables dependency injection):**

```tsx
// Define a GENERIC interface that any provider can implement
interface ComposerState {
  input: string
  attachments: Attachment[]
  isSubmitting: boolean
}

interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void
  submit: () => void
}

interface ComposerMeta {
  inputRef: React.RefObject<TextInput>
}

interface ComposerContextValue {
  state: ComposerState
  actions: ComposerActions
  meta: ComposerMeta
}

const ComposerContext = createContext<ComposerContextValue | null>(null)
```

**UI components consume the interface, not the implementation:**

```tsx
function ComposerInput() {
  const {
    state,
    actions: { update },
    meta,
  } = use(ComposerContext)

  // This component works with ANY provider that implements the interface
  return (
    <TextInput
      ref={meta.inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}
```

**Different providers implement the same interface:**

```tsx
// Provider A: Local state for ephemeral forms
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const inputRef = useRef(null)
  const submit = useForwardMessage()

  return (
    <ComposerContext
      value={{
        state,
        actions: { update: setState, submit },
        meta: { inputRef },
      }}
    >
      {children}
    </ComposerContext>
  )
}

// Provider B: Global synced state for channels
function ChannelProvider({ channelId, children }: Props) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)

  return (
    <ComposerContext
      value={{
        state,
        actions: { update, submit },
        meta: { inputRef },
      }}
    >
      {children}
    </ComposerContext>
  )
}
```

**The same composed UI works with both:**

```tsx
// Works with ForwardMessageProvider (local state)
<ForwardMessageProvider>
  <Composer.Frame>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Frame>
</ForwardMessageProvider>

// Works with ChannelProvider (global synced state)
<ChannelProvider channelId="abc">
  <Composer.Frame>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Frame>
</ChannelProvider>
```

**Custom UI outside the component can access state and actions:**

The provider boundary is what matters—not the visual nesting. Components that
need shared state don't have to be inside the `Composer.Frame`. They just need
to be within the provider.

```tsx
function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        {/* The composer UI */}
        <Composer.Frame>
          <Composer.Input placeholder="Add a message, if you'd like." />
          <Composer.Footer>
            <Composer.Formatting />
            <Composer.Emojis />
          </Composer.Footer>
        </Composer.Frame>

        {/* Custom UI OUTSIDE the composer, but INSIDE the provider */}
        <MessagePreview />

        {/* Actions at the bottom of the dialog */}
        <DialogActions>
          <CancelButton />
          <ForwardButton />
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

// This button lives OUTSIDE Composer.Frame but can still submit based on its context!
function ForwardButton() {
  const {
    actions: { submit },
  } = use(ComposerContext)
  return <Button onPress={submit}>Forward</Button>
}

// This preview lives OUTSIDE Composer.Frame but can read composer's state!
function MessagePreview() {
  const { state } = use(ComposerContext)
  return <Preview message={state.input} attachments={state.attachments} />
}
```

The `ForwardButton` and `MessagePreview` are not visually inside the composer
box, but they can still access its state and actions. This is the power of
lifting state into providers.

The UI is reusable bits you compose together. The state is dependency-injected
by the provider. Swap the provider, keep the UI.

### 2.3 Guard Context Access with a Custom Hook

**Impact: MEDIUM (turns "cannot read property of null" into a clear, actionable error at the usage site)**

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

### 2.4 Lift State into Provider Components

**Impact: HIGH (enables state sharing outside component boundaries)**

Move state management into dedicated provider components. This allows sibling
components outside the main UI to access and modify state without prop drilling
or awkward refs.

**Incorrect (state trapped inside component):**

```tsx
function ForwardMessageComposer() {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer />
    </Composer.Frame>
  )
}

// Problem: How does this button access composer state?
function ForwardMessageDialog() {
  return (
    <Dialog>
      <ForwardMessageComposer />
      <MessagePreview /> {/* Needs composer state */}
      <DialogActions>
        <CancelButton />
        <ForwardButton /> {/* Needs to call submit */}
      </DialogActions>
    </Dialog>
  )
}
```

**Incorrect (useEffect to sync state up):**

```tsx
function ForwardMessageDialog() {
  const [input, setInput] = useState('')
  return (
    <Dialog>
      <ForwardMessageComposer onInputChange={setInput} />
      <MessagePreview input={input} />
    </Dialog>
  )
}

function ForwardMessageComposer({ onInputChange }) {
  const [state, setState] = useState(initialState)
  useEffect(() => {
    onInputChange(state.input) // Sync on every change 😬
  }, [state.input])
}
```

**Incorrect (reading state from ref on submit):**

```tsx
function ForwardMessageDialog() {
  const stateRef = useRef(null)
  return (
    <Dialog>
      <ForwardMessageComposer stateRef={stateRef} />
      <ForwardButton onPress={() => submit(stateRef.current)} />
    </Dialog>
  )
}
```

**Correct (state lifted to provider):**

```tsx
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  )
}

function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        <ForwardMessageComposer />
        <MessagePreview /> {/* Custom components can access state and actions */}
        <DialogActions>
          <CancelButton />
          <ForwardButton /> {/* Custom components can access state and actions */}
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

function ForwardButton() {
  const { actions } = use(Composer.Context)
  return <Button onPress={actions.submit}>Forward</Button>
}
```

The ForwardButton lives outside the Composer.Frame but still has access to the
submit action because it's within the provider. Even though it's a one-off
component, it can still access the composer's state and actions from outside the
UI itself.

**Key insight:** Components that need shared state don't have to be visually
nested inside each other—they just need to be within the same provider.

### 2.5 Split Context by Update Frequency

**Impact: MEDIUM (prevents action-only consumers from re-rendering on every state change)**

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

---

## 3. Implementation Patterns

**Impact: MEDIUM**

Specific techniques for implementing compound components and

### 3.1 Create Explicit Component Variants

**Impact: MEDIUM (self-documenting code, no hidden conditionals)**

Instead of one component with many boolean props, create explicit variant
components. Each variant composes the pieces it needs. The code documents
itself.

**Incorrect (one component, many modes):**

```tsx
// What does this component actually render?
<Composer
  isThread
  isEditing={false}
  channelId='abc'
  showAttachments
  showFormatting={false}
/>
```

**Correct (explicit variants):**

```tsx
// Immediately clear what this renders
<ThreadComposer channelId="abc" />

// Or
<EditMessageComposer messageId="xyz" />

// Or
<ForwardMessageComposer messageId="123" />
```

Each implementation is unique, explicit and self-contained. Yet they can each
use shared parts.

**Implementation:**

```tsx
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input />
        <AlsoSendToChannelField channelId={channelId} />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.Submit />
        </Composer.Footer>
      </Composer.Frame>
    </ThreadProvider>
  )
}

function EditMessageComposer({ messageId }: { messageId: string }) {
  return (
    <EditMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.CancelEdit />
          <Composer.SaveEdit />
        </Composer.Footer>
      </Composer.Frame>
    </EditMessageProvider>
  )
}

function ForwardMessageComposer({ messageId }: { messageId: string }) {
  return (
    <ForwardMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input placeholder="Add a message, if you'd like." />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.Mentions />
        </Composer.Footer>
      </Composer.Frame>
    </ForwardMessageProvider>
  )
}
```

Each variant is explicit about:

- What provider/state it uses
- What UI elements it includes
- What actions are available

No boolean prop combinations to reason about. No impossible states.

### 3.2 Merge Forwarded Refs with Internal Refs

**Impact: LOW (lets a component expose its ref to consumers without losing its own internal ref)**

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

### 3.3 Prefer Composing Children Over Render Props

**Impact: MEDIUM (cleaner composition, better readability)**

Use `children` for composition instead of `renderX` props. Children are more
readable, compose naturally, and don't require understanding callback
signatures.

**Incorrect (render props):**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
}: {
  renderHeader?: () => React.ReactNode
  renderFooter?: () => React.ReactNode
  renderActions?: () => React.ReactNode
}) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {renderFooter ? renderFooter() : <DefaultFooter />}
      {renderActions?.()}
    </form>
  )
}

// Usage is awkward and inflexible
return (
  <Composer
    renderHeader={() => <CustomHeader />}
    renderFooter={() => (
      <>
        <Formatting />
        <Emojis />
      </>
    )}
    renderActions={() => <SubmitButton />}
  />
)
```

**Correct (compound components with children):**

```tsx
function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}</form>
}

function ComposerFooter({ children }: { children: React.ReactNode }) {
  return <footer className='flex'>{children}</footer>
}

// Usage is flexible
return (
  <Composer.Frame>
    <CustomHeader />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Emojis />
      <SubmitButton />
    </Composer.Footer>
  </Composer.Frame>
)
```

**When render props are appropriate:**

```tsx
// Render props work well when you need to pass data back
<List
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
/>
```

Use render props when the parent needs to provide data or state to the child.
Use children when composing static structure.

### 3.4 State Reducer and Prop Getters for Deep Customization

**Impact: MEDIUM (lets consumers override internal state transitions without forking the component)**

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

### 3.5 Support Both Controlled and Uncontrolled Usage

**Impact: MEDIUM (one component API serves both simple and externally-synced use cases)**

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

### 3.6 Use Discriminated Unions Instead of Optional Prop Combinations

**Impact: MEDIUM (makes impossible prop combinations unrepresentable at the type level)**

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

---

## 4. React 19 APIs

**Impact: MEDIUM**

React 19+ only. Don't use `forwardRef`; use `use()` instead of `useContext()`.

> **⚠️ React 19+ only. Skip this section if using React 18 or earlier.**

### 4.1 React 19 API Changes

**Impact: MEDIUM (cleaner component definitions and context usage)**

> **⚠️ React 19+ only.** Skip this if you're on React 18 or earlier.

In React 19, `ref` is now a regular prop (no `forwardRef` wrapper needed), and `use()` replaces `useContext()`.

**Incorrect (forwardRef in React 19):**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**Correct (ref as a regular prop):**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

**Incorrect (useContext in React 19):**

```tsx
const value = useContext(MyContext)
```

**Correct (use instead of useContext):**

```tsx
const value = use(MyContext)
```

`use()` can also be called conditionally, unlike `useContext()`.

---

## References

1. [https://react.dev](https://react.dev)
2. [https://react.dev/learn/passing-data-deeply-with-context](https://react.dev/learn/passing-data-deeply-with-context)
3. [https://react.dev/reference/react/use](https://react.dev/reference/react/use)
4. [Radix UI - asChild](https://www.radix-ui.com/primitives/docs/guides/composition)
5. [Kent C. Dodds - How to optimize your context value](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
6. [Kent C. Dodds - The State Reducer Pattern](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks)
7. [React - Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
8. [TypeScript - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
9. [React - Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
10. [React - Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
11. [Headless UI Components](https://www.merrickchristensen.com/articles/headless-user-interface-components/)
12. [Kent C. Dodds - How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
