---
title: Separate Behavior from Presentation with Headless Components
impact: HIGH
impactDescription: the same interaction logic renders completely different UIs without duplication
tags: composition, headless, hooks, architecture
---

## Separate Behavior from Presentation with Headless Components

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
