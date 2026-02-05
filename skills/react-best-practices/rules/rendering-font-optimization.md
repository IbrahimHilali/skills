---
title: Optimize Font Loading
impact: MEDIUM-HIGH
impactDescription: eliminates layout shift and invisible-text flash from web fonts
tags: rendering, fonts, cls, fout, foit
---

## Optimize Font Loading

A `@font-face` loaded via a render-blocking stylesheet either hides text
until the font arrives (FOIT — flash of invisible text) or swaps in a
fallback font and reflows the page once the real font loads (FOUT), both of
which hurt Largest Contentful Paint and Cumulative Layout Shift. Self-host
fonts with `next/font` (or `font-display: optional`/`swap` and a matched
fallback) so text is visible immediately and doesn't jump when the webfont
arrives.

**Incorrect (render-blocking stylesheet, no fallback matching):**

```tsx
// _document.tsx
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700"
  rel="stylesheet"
/>
```

```css
body {
  font-family: 'Inter', sans-serif; /* fallback has different metrics -> layout shift on swap */
}
```

**Correct (self-hosted, size-adjusted fallback, no extra network request):**

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // text stays visible with fallback until Inter loads
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

`next/font` self-hosts the font file (no third-party request to Google
Fonts at runtime), inlines the `@font-face`, and automatically computes a
size-adjusted fallback font so the layout doesn't shift when the real font
swaps in. Without a framework helper, achieve the same with a self-hosted
`@font-face`, `font-display: swap`, and `size-adjust`/`ascent-override` on a
matching fallback.

Reference: [Next.js - Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
