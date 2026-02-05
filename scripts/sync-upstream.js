#!/usr/bin/env node
// Pulls new rule files from an upstream skills repo (e.g. vercel-labs/agent-skills)
// into a local skill's rules/ directory. Never overwrites a file that already
// exists locally, so custom rules (and any local edits to synced ones) are safe.
//
// Usage:
//   node scripts/sync-upstream.js <skill-name> <owner/repo> [path-in-repo]
//
// Example:
//   node scripts/sync-upstream.js react-best-practices vercel-labs/agent-skills

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const skillsRoot = join(__dirname, '..', 'skills')

const [, , skillName, repo, subpath] = process.argv

if (!skillName || !repo) {
  console.error('Usage: node scripts/sync-upstream.js <skill-name> <owner/repo> [path-in-repo]')
  process.exit(1)
}

const localRulesDir = join(skillsRoot, skillName, 'rules')
if (!existsSync(localRulesDir)) {
  console.error(`No local skill "${skillName}" with a rules/ directory at ${localRulesDir}`)
  process.exit(1)
}

const remotePath = subpath || `skills/${skillName}/rules`
const apiUrl = `https://api.github.com/repos/${repo}/contents/${remotePath}`

const res = await fetch(apiUrl, { headers: { 'User-Agent': 'claude-skills-lib-sync' } })
if (!res.ok) {
  console.error(`GitHub API request failed (${res.status} ${res.statusText}): ${apiUrl}`)
  process.exit(1)
}

const entries = await res.json()
if (!Array.isArray(entries)) {
  console.error(`Unexpected response from GitHub API for ${apiUrl}`)
  process.exit(1)
}

let added = 0
let skipped = 0

for (const entry of entries) {
  if (entry.type !== 'file' || !entry.name.endsWith('.md')) continue
  const localPath = join(localRulesDir, entry.name)
  if (existsSync(localPath)) {
    skipped++
    continue
  }
  const fileRes = await fetch(entry.download_url)
  if (!fileRes.ok) {
    console.error(`  ! failed to fetch ${entry.name}: ${fileRes.status}`)
    continue
  }
  const content = await fileRes.text()
  writeFileSync(localPath, content)
  added++
  console.log(`  + ${entry.name}`)
}

console.log(
  `\nSynced ${skillName} from ${repo}/${remotePath}: ${added} added, ${skipped} already present (never overwritten).`,
)
if (added > 0) {
  console.log(`Run \`npm run build -- ${skillName}\` to recompile AGENTS.md.`)
}
