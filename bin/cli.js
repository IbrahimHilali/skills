#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import prompts from "prompts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, "..", "skills");
const TARGET_ROOT = path.join(process.cwd(), ".claude", "skills");

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fields;
}

async function listSkills() {
  const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMdPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    try {
      const content = await fs.readFile(skillMdPath, "utf8");
      const { name, description } = parseFrontmatter(content);
      skills.push({
        dir: entry.name,
        name: name || entry.name,
        description: description || "",
      });
    } catch {
      // No SKILL.md, skip this directory.
    }
  }
  return skills;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const requestedName = process.argv[2];
  const skills = await listSkills();

  if (skills.length === 0) {
    console.error("No skills found in this package.");
    process.exit(1);
  }

  let selectedDirs;

  if (requestedName) {
    const match = skills.find((s) => s.dir === requestedName || s.name === requestedName);
    if (!match) {
      console.error(`No skill named "${requestedName}" found. Available: ${skills.map((s) => s.dir).join(", ")}`);
      process.exit(1);
    }
    selectedDirs = [match.dir];
  } else {
    const response = await prompts({
      type: "multiselect",
      name: "chosen",
      message: "Select skills to install into ./.claude/skills/",
      hint: "Space to select, Enter to confirm",
      instructions: false,
      choices: skills.map((s) => ({
        title: s.name,
        description: s.description,
        value: s.dir,
      })),
    });

    if (!response.chosen || response.chosen.length === 0) {
      console.log("No skills selected. Nothing installed.");
      return;
    }
    selectedDirs = response.chosen;
  }

  for (const dir of selectedDirs) {
    const src = path.join(SKILLS_DIR, dir);
    const dest = path.join(TARGET_ROOT, dir);
    await copyDir(src, dest);
    console.log(`Installed ${dir} -> ${path.relative(process.cwd(), dest)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
