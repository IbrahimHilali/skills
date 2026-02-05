#!/usr/bin/env node
// Compiles each skill's rules/*.md files into AGENTS.md, and regenerates
// the "Quick Reference" block and rule count in SKILL.md.
//
// Usage:
//   node scripts/build.js                    # build every skill
//   node scripts/build.js react-best-practices  # build one skill

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, cleanBody, slugify, parseSections } from './lib/parse.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const skillsRoot = join(__dirname, '..', 'skills')

function loadRules(rulesDir, sections) {
  const bySection = new Map(sections.map((s) => [s.prefix, []]))
  const files = readdirSync(rulesDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('_'),
  )

  for (const file of files) {
    const prefix = file.split('-')[0]
    if (!bySection.has(prefix)) {
      throw new Error(
        `${file}: prefix "${prefix}" has no matching section in _sections.md`,
      )
    }
    const raw = readFileSync(join(rulesDir, file), 'utf8')
    const { data, body } = parseFrontmatter(raw)
    if (!data.title) throw new Error(`${file}: frontmatter is missing "title"`)
    if (!data.impact) throw new Error(`${file}: frontmatter is missing "impact"`)
    bySection.get(prefix).push({
      file,
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      impact: data.impact,
      impactDescription: data.impactDescription || '',
      body: cleanBody(body),
    })
  }

  for (const rules of bySection.values()) {
    rules.sort((a, b) => a.title.localeCompare(b.title))
  }

  return bySection
}

function renderReferences(references) {
  return (references || [])
    .map((ref, i) => `${i + 1}. [${ref.label}](${ref.url})`)
    .join('\n')
}

function buildSkill(skillName) {
  const dir = join(skillsRoot, skillName)
  const rulesDir = join(dir, 'rules')

  const sections = parseSections(readFileSync(join(rulesDir, '_sections.md'), 'utf8'))
  const metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'))
  const bySection = loadRules(rulesDir, sections)

  let ruleCount = 0
  const tocLines = []
  const sectionBodies = []

  sections.forEach((section, sIdx) => {
    const rules = bySection.get(section.prefix) || []
    ruleCount += rules.length
    const sectionNum = sIdx + 1
    const sectionAnchor = slugify(`${sectionNum}. ${section.title}`)

    tocLines.push(
      `${sectionNum}. [${section.title}](#${sectionAnchor}) — **${section.impact}**`,
    )
    rules.forEach((rule, rIdx) => {
      const num = `${sectionNum}.${rIdx + 1}`
      tocLines.push(`   - ${num} [${rule.title}](#${slugify(`${num} ${rule.title}`)})`)
    })

    const ruleTexts = rules.map((rule, rIdx) => {
      const num = `${sectionNum}.${rIdx + 1}`
      const impactLine = rule.impactDescription
        ? `**Impact: ${rule.impact} (${rule.impactDescription})**`
        : `**Impact: ${rule.impact}**`
      return `### ${num} ${rule.title}\n\n${impactLine}\n\n${rule.body}`
    })

    const noteBlock = section.note ? `\n\n> **${section.note}**` : ''

    sectionBodies.push(
      `## ${sectionNum}. ${section.title}\n\n**Impact: ${section.impact}**\n\n${section.description}${noteBlock}` +
        (ruleTexts.length ? `\n\n${ruleTexts.join('\n\n')}` : ''),
    )
  })

  const abstract = metadata.abstract.replace(/\d+\+?(?=\s+rules)/, String(ruleCount))
  const noteLines = metadata.note.split('\n').join('\n> ')

  const doc = `# ${metadata.title}

**Version ${metadata.version}**  \n${metadata.date}

> **Note:**  \n> ${noteLines}

---

## Abstract

${abstract}

---

## Table of Contents

${tocLines.join('\n')}

---

${sectionBodies.join('\n\n---\n\n')}

---

## References

${renderReferences(metadata.references)}
`

  writeFileSync(join(dir, 'AGENTS.md'), doc)

  const skillMdPath = join(dir, 'SKILL.md')
  let skillMd = readFileSync(skillMdPath, 'utf8')
  skillMd = skillMd.replace(/\d+\+?(?=\s+rules)/, String(ruleCount))

  const quickRef = ['## Quick Reference', '']
  sections.forEach((section, sIdx) => {
    const rules = bySection.get(section.prefix) || []
    quickRef.push(`### ${sIdx + 1}. ${section.title} (${section.impact})`, '')
    if (section.note) {
      quickRef.push(`> **${section.note}**`, '')
    }
    for (const rule of rules) {
      quickRef.push(`- \`${rule.slug}\` - ${rule.title}`)
    }
    quickRef.push('')
  })

  skillMd = skillMd.replace(
    /## Quick Reference[\s\S]*?(?=\n## How to Use)/,
    quickRef.join('\n').replace(/\n+$/, '\n'),
  )

  writeFileSync(skillMdPath, skillMd)

  console.log(`✓ ${skillName}: ${ruleCount} rules across ${sections.length} sections`)
}

function discoverSkills() {
  return readdirSync(skillsRoot).filter((name) =>
    existsSync(join(skillsRoot, name, 'rules', '_sections.md')),
  )
}

const target = process.argv[2]
const targets = target ? [target] : discoverSkills()

for (const skill of targets) {
  const dir = join(skillsRoot, skill)
  if (!existsSync(join(dir, 'rules', '_sections.md'))) {
    console.error(`✗ ${skill}: no rules/_sections.md found`)
    process.exitCode = 1
    continue
  }
  try {
    buildSkill(skill)
  } catch (err) {
    console.error(`✗ ${skill}: ${err.message}`)
    process.exitCode = 1
  }
}
