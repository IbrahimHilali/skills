---
name: composition-patterns
description:
  React composition patterns that scale. Use when refactoring components with
  boolean prop proliferation, building flexible component libraries, or
  designing reusable APIs. Triggers on tasks involving compound components,
  render props, context providers, or component architecture. Includes React 19
  API changes.
metadata:
  version: '1.0.0'
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid
boolean prop proliferation by using compound components, lifting state, and
composing internals. These patterns make codebases easier for both humans and AI
agents to work with as they scale.

## When to Apply

Reference these guidelines when:

- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |
| 4        | React 19 APIs           | MEDIUM | `react19-`      |

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` - Avoid Boolean Prop Proliferation
- `architecture-prefer-hooks-over-hocs` - Prefer Custom Hooks Over Higher-Order Components
- `architecture-headless-components` - Separate Behavior from Presentation with Headless Components
- `architecture-polymorphic-as-child` - Use asChild for Polymorphic Rendering
- `architecture-compound-components` - Use Compound Components

### 2. State Management (MEDIUM)

- `state-decouple-implementation` - Decouple State Management from UI
- `state-context-interface` - Define Generic Context Interfaces for Dependency Injection
- `state-context-hook-guard` - Guard Context Access with a Custom Hook
- `state-lift-state` - Lift State into Provider Components
- `state-split-context-by-usage` - Split Context by Update Frequency

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` - Create Explicit Component Variants
- `patterns-merge-refs` - Merge Forwarded Refs with Internal Refs
- `patterns-children-over-render-props` - Prefer Composing Children Over Render Props
- `patterns-state-reducer` - State Reducer and Prop Getters for Deep Customization
- `patterns-controlled-uncontrolled` - Support Both Controlled and Uncontrolled Usage
- `patterns-discriminated-union-props` - Use Discriminated Unions Instead of Optional Prop Combinations

### 4. React 19 APIs (MEDIUM)

> **⚠️ React 19+ only. Skip this section if using React 18 or earlier.**

- `react19-no-forwardref` - React 19 API Changes

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/architecture-avoid-boolean-props.md
rules/state-context-interface.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
