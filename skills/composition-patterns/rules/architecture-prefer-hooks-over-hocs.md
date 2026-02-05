---
title: Prefer Custom Hooks Over Higher-Order Components
impact: HIGH
impactDescription: avoids wrapper hell and prop-name collisions from stacked HOCs
tags: composition, hooks, hoc, architecture
---

## Prefer Custom Hooks Over Higher-Order Components

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
