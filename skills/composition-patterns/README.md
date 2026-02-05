# React Composition Patterns

A structured repository for React composition patterns that scale. These
patterns help avoid boolean prop proliferation by using compound components,
lifting state, and composing internals.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `area-description.md` - Individual rule files
- `metadata.json` - Document metadata (version, organization, abstract)
- **`AGENTS.md`** - Compiled output (generated)

## Rules

### Component Architecture (CRITICAL)

- `architecture-avoid-boolean-props.md` - Don't add boolean props to customize
  behavior
- `architecture-compound-components.md` - Structure as compound components with
  shared context
- `architecture-polymorphic-as-child.md` - Use `asChild` for polymorphic
  rendering instead of an `as` prop
- `architecture-prefer-hooks-over-hocs.md` - Extract shared behavior into
  custom hooks instead of stacking HOCs
- `architecture-headless-components.md` - Separate interaction logic from
  presentation with a headless hook

### State Management (HIGH)

- `state-lift-state.md` - Lift state into provider components
- `state-context-interface.md` - Define clear context interfaces
  (state/actions/meta)
- `state-decouple-implementation.md` - Decouple state management from UI
- `state-split-context-by-usage.md` - Split state/actions into separate
  contexts to avoid unnecessary re-renders
- `state-context-hook-guard.md` - Guard context access with a custom hook
  that throws when used outside its provider

### Implementation Patterns (MEDIUM)

- `patterns-children-over-render-props.md` - Prefer children over renderX props
- `patterns-explicit-variants.md` - Create explicit component variants
- `patterns-state-reducer.md` - State reducer and prop getters for deep
  customization
- `patterns-controlled-uncontrolled.md` - Support both controlled and
  uncontrolled usage
- `patterns-discriminated-union-props.md` - Discriminated unions instead of
  optional prop combinations
- `patterns-merge-refs.md` - Merge forwarded refs with internal refs

## Core Principles

1. **Composition over configuration** — Instead of adding props, let consumers
   compose
2. **Lift your state** — State in providers, not trapped in components
3. **Compose your internals** — Subcomponents access context, not props
4. **Explicit variants** — Create ThreadComposer, EditComposer, not Composer
   with isThread

## Creating a New Rule

1. Copy `rules/_template.md` to `rules/area-description.md`
2. Choose the appropriate area prefix:
   - `architecture-` for Component Architecture
   - `state-` for State Management
   - `patterns-` for Implementation Patterns
3. Fill in the frontmatter and content
4. Ensure you have clear examples with explanations

## Impact Levels

- `CRITICAL` - Foundational patterns, prevents unmaintainable code
- `HIGH` - Significant maintainability improvements
- `MEDIUM` - Good practices for cleaner code

## Attribution

This skill's baseline rules were sourced from
[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
(MIT licensed, Copyright (c) Vercel, Inc.):

- `architecture-avoid-boolean-props.md`
- `architecture-compound-components.md`
- `patterns-children-over-render-props.md`
- `patterns-explicit-variants.md`
- `react19-no-forwardref.md`
- `state-context-interface.md`
- `state-decouple-implementation.md`
- `state-lift-state.md`

The remaining rules were added on top of that base. See the repo's root
[LICENSE](../../LICENSE) for full license text.
