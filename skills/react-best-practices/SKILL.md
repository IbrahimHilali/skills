---
name: react-best-practices
description: React and Next.js performance optimization guidelines. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
metadata:
  version: "1.0.0"
---

# React Best Practices

Comprehensive performance optimization guide for React and Next.js applications. Contains 80 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-batch-n-plus-one` - Batch N+1 Fetches Instead of Looping
- `async-cheap-condition-before-await` - Check Cheap Conditions Before Async Flags
- `async-defer-await` - Defer Await Until Needed
- `async-dependencies` - Dependency-Based Parallelization
- `async-api-routes` - Prevent Waterfall Chains in API Routes
- `async-parallel` - Promise.all() for Independent Operations
- `async-suspense-boundaries` - Strategic Suspense Boundaries

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Avoid Barrel File Imports
- `bundle-conditional` - Conditional Module Loading
- `bundle-defer-third-party` - Defer Non-Critical Third-Party Libraries
- `bundle-dynamic-imports` - Dynamic Imports for Heavy Components
- `bundle-minimize-client-boundary` - Minimize Client Boundary Size in RSC
- `bundle-analyzable-paths` - Prefer Statically Analyzable Paths
- `bundle-preload` - Preload Based on User Intent

### 3. Server-Side Performance (HIGH)

- `server-auth-actions` - Authenticate Server Actions Like API Routes
- `server-dedup-props` - Avoid Duplicate Serialization in RSC Props
- `server-no-shared-module-state` - Avoid Shared Module State for Request Data
- `server-cache-lru` - Cross-Request LRU Caching
- `server-hoist-static-io` - Hoist Static I/O to Module Level
- `server-serialization` - Minimize Serialization at RSC Boundaries
- `server-parallel-fetching` - Parallel Data Fetching with Component Composition
- `server-parallel-nested-fetching` - Parallel Nested Data Fetching
- `server-cache-react` - Per-Request Deduplication with React.cache()
- `server-streaming-response` - Stream Large Responses Instead of Buffering
- `server-after-nonblocking` - Use after() for Non-Blocking Operations

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-abort-stale-requests` - Abort Stale Requests on Param Change
- `client-debounce-expensive-handlers` - Debounce or Throttle Expensive Event Handlers
- `client-event-listeners` - Deduplicate Global Event Listeners
- `client-passive-event-listeners` - Use Passive Event Listeners for Scrolling Performance
- `client-swr-dedup` - Use SWR for Automatic Deduplication
- `client-localstorage-schema` - Version and Minimize localStorage Data

### 5. Re-render Optimization (MEDIUM)

- `rerender-derived-state-no-effect` - Calculate Derived State During Rendering
- `rerender-defer-reads` - Defer State Reads to Usage Point
- `rerender-simple-expression-in-memo` - Do not wrap a simple expression with a primitive result type in useMemo
- `rerender-no-inline-components` - Don't Define Components Inside Components
- `rerender-memo-with-default-value` - Extract Default Non-primitive Parameter Value from Memoized Component to Constant
- `rerender-memo` - Extract to Memoized Components
- `rerender-dependencies` - Narrow Effect Dependencies
- `rerender-move-effect-to-event` - Put Interaction Logic in Event Handlers
- `rerender-split-combined-hooks` - Split Combined Hook Computations
- `rerender-derived-state` - Subscribe to Derived State
- `rerender-functional-setstate` - Use Functional setState Updates
- `rerender-key-reset` - Use key to Reset Component State
- `rerender-lazy-state-init` - Use Lazy State Initialization
- `rerender-transitions` - Use Transitions for Non-Urgent Updates
- `rerender-use-deferred-value` - Use useDeferredValue for Expensive Derived Renders
- `rerender-use-ref-transient-values` - Use useRef for Transient Values

### 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` - Animate SVG Wrapper Instead of SVG Element
- `rendering-content-visibility` - CSS content-visibility for Long Lists
- `rendering-hoist-jsx` - Hoist Static JSX Elements
- `rendering-font-optimization` - Optimize Font Loading
- `rendering-image-optimization` - Optimize Images for LCP
- `rendering-svg-precision` - Optimize SVG Precision
- `rendering-hydration-no-flicker` - Prevent Hydration Mismatch Without Flickering
- `rendering-hydration-suppress-warning` - Suppress Expected Hydration Mismatches
- `rendering-activity` - Use Activity Component for Show/Hide
- `rendering-script-defer-async` - Use defer or async on Script Tags
- `rendering-conditional-render` - Use Explicit Conditional Rendering
- `rendering-resource-hints` - Use React DOM Resource Hints
- `rendering-usetransition-loading` - Use useTransition Over Manual Loading States
- `rendering-virtualize-long-lists` - Virtualize Long Lists

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` - Avoid Layout Thrashing
- `js-index-maps` - Build Index Maps for Repeated Lookups
- `js-cache-property-access` - Cache Property Access in Loops
- `js-cache-function-results` - Cache Repeated Function Calls
- `js-cache-storage` - Cache Storage API Calls
- `js-combine-iterations` - Combine Multiple Array Iterations
- `js-request-idle-callback` - Defer Non-Critical Work with requestIdleCallback
- `js-length-check-first` - Early Length Check for Array Comparisons
- `js-early-exit` - Early Return from Functions
- `js-hoist-regexp` - Hoist RegExp Creation
- `js-flatmap-filter` - Use flatMap to Map and Filter in One Pass
- `js-min-max-loop` - Use Loop for Min/Max Instead of Sort
- `js-set-map-lookups` - Use Set/Map for O(1) Lookups
- `js-tosorted-immutable` - Use toSorted() Instead of sort() for Immutability

### 8. Advanced Patterns (LOW)

- `advanced-cleanup-effects` - Clean Up Effects to Prevent Leaks
- `advanced-effect-event-deps` - Do Not Put Effect Events in Dependency Arrays
- `advanced-init-once` - Initialize App Once, Not Per Mount
- `advanced-event-handler-refs` - Store Event Handlers in Refs
- `advanced-use-latest` - useEffectEvent for Stable Callback Refs

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
