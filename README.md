# claude-skills-lib

A personal library of Claude Code skills. Each skill lives in `skills/<name>/`
as a `SKILL.md` (plus any supporting files) and can be installed into any
project via `npx`.

## Usage

From inside the target project (once published to npm):

```sh
npx claude-skills-lib
```

This shows an interactive checklist of available skills and copies the
selected ones into `./.claude/skills/`.

Install a specific skill without the picker:

```sh
npx claude-skills-lib <skill-name>
```

## Local development

Without publishing, run the CLI directly against another project:

```sh
cd /path/to/other-project
node /path/to/claude-skills-lib/bin/cli.js
```

Or link it globally:

```sh
npm link
cd /path/to/other-project
claude-skills-lib
```

## Adding a skill

Create `skills/<skill-name>/SKILL.md` with frontmatter:

```markdown
---
name: skill-name
description: One-line description shown in the install picker.
---

Skill instructions here.
```

Any additional files in the skill's directory are copied along with it.
