export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Missing frontmatter block (expected leading --- ... ---)')
  }
  const [, fm, body] = match
  const data = {}
  for (const line of fm.split('\n')) {
    if (!line.trim()) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    data[key] = value
  }
  return { data, body }
}

// Rule file bodies conventionally repeat the frontmatter title as a leading
// "## Title" heading (and sometimes an "**Impact: ...**" line right after).
// The compiled doc regenerates both from frontmatter, so strip the
// duplicates here to avoid doubling them up in AGENTS.md.
export function cleanBody(body) {
  const lines = body.replace(/^\n+/, '').split('\n')
  if (lines[0]?.startsWith('## ')) {
    lines.shift()
    while (lines[0] === '') lines.shift()
  }
  if (lines[0]?.match(/^\*\*Impact:.*\*\*$/)) {
    lines.shift()
    while (lines[0] === '') lines.shift()
  }
  return lines.join('\n').trim()
}

// Approximates GitHub's markdown heading-anchor slugification closely
// enough for the internal TOC links we generate ourselves.
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[`'".,:;!?()&/\\]/g, '')
    .replace(/\+/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Parses rules/_sections.md: a sequence of
//   ## <order>. <Title> (<prefix>)
//   **Impact:** <IMPACT>
//   **Description:** <description>
//   **Note:** <optional free-text callout, e.g. a version-gating warning>
export function parseSections(raw) {
  const blocks = raw.split(/\n(?=## )/).filter((b) => b.trim().startsWith('## '))
  const sections = []
  for (const block of blocks) {
    const heading = block.match(/^##\s+(\d+)\.\s+(.+?)\s+\(([\w-]+)\)/)
    if (!heading) continue
    const [, order, title, prefix] = heading
    const impact = block.match(/\*\*Impact:\*\*\s*(.+?)\s*$/m)
    const description = block.match(/\*\*Description:\*\*\s*([\s\S]+?)\s*(?=\n\*\*Note:\*\*|$)/m)
    const note = block.match(/\*\*Note:\*\*\s*([\s\S]+?)\s*$/m)
    sections.push({
      order: Number(order),
      title,
      prefix,
      impact: impact ? impact[1].trim() : '',
      description: description ? description[1].trim() : '',
      note: note ? note[1].trim() : '',
    })
  }
  return sections.sort((a, b) => a.order - b.order)
}
