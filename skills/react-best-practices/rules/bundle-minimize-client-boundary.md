---
title: Minimize Client Boundary Size in RSC
impact: HIGH
impactDescription: shrinks client bundle by keeping non-interactive code on the server
tags: bundle, rsc, server-components, use-client
---

## Minimize Client Boundary Size in RSC

Adding `'use client'` to a file sends that module and everything it imports
to the browser. Don't put `'use client'` at the top of a large file that
mixes static, non-interactive markup with the one button that needs
`onClick`. Push the boundary down to the smallest leaf component that
actually needs interactivity.

**Incorrect (whole page becomes client bundle for one button):**

```tsx
'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { ArticleBody } from './article-body'

export function ArticlePage({ article }: { article: Article }) {
  return (
    <div>
      <Header />
      <Sidebar />
      <ArticleBody content={article.content} />
      <button onClick={() => shareArticle(article.id)}>Share</button>
    </div>
  )
}
```

**Correct (only the interactive leaf is a client component):**

```tsx
// article-page.tsx — stays a Server Component
import { Header } from './header'
import { Sidebar } from './sidebar'
import { ArticleBody } from './article-body'
import { ShareButton } from './share-button'

export function ArticlePage({ article }: { article: Article }) {
  return (
    <div>
      <Header />
      <Sidebar />
      <ArticleBody content={article.content} />
      <ShareButton articleId={article.id} />
    </div>
  )
}

// share-button.tsx
'use client'

export function ShareButton({ articleId }: { articleId: string }) {
  return <button onClick={() => shareArticle(articleId)}>Share</button>
}
```

`Header`, `Sidebar`, and `ArticleBody` (and anything they import) stay on the
server and never ship to the client. Only `ShareButton`'s small module
crosses the boundary.

Reference: [Next.js - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components#moving-client-components-down-the-tree)
