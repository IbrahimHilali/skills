---
title: Optimize Images for LCP
impact: HIGH
impactDescription: prevents layout shift and speeds up Largest Contentful Paint
tags: rendering, images, lcp, cls, next-image
---

## Optimize Images for LCP

A raw `<img>` with no dimensions causes layout shift as it loads, and an
above-the-fold hero image with no priority hint competes with everything
else for bandwidth, delaying Largest Contentful Paint. Use `next/image` (or
an equivalent), always set explicit dimensions, and mark the LCP image as a
priority.

**Incorrect (no dimensions, no priority, unoptimized format):**

```tsx
function Hero({ imageUrl }: { imageUrl: string }) {
  return <img src={imageUrl} alt="Hero" /> // causes CLS while loading, no responsive srcset
}
```

**Correct (dimensions reserved, priority hint, responsive/optimized delivery):**

```tsx
import Image from 'next/image'

function Hero({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      src={imageUrl}
      alt="Hero"
      width={1200}
      height={600}
      priority // this is the LCP element — skip lazy loading
    />
  )
}

function ProductThumbnail({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      src={imageUrl}
      alt="Product"
      width={200}
      height={200}
      loading="lazy" // below the fold — defer until near viewport
    />
  )
}
```

`width`/`height` (or `fill` with a sized container) reserve layout space
before the image loads, eliminating cumulative layout shift. `priority` on
the one image that's actually the LCP candidate skips lazy-loading and hints
the browser to fetch it first; every other image should lazy-load by
default.

Reference: [Next.js - Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
