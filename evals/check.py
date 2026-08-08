#!/usr/bin/env python3
"""cobots evals — tier 1 structural lint + tier 2 trigger checks.

Run from the repo root: python3 evals/check.py
Exit 0 = green. Any finding prints and exits 1.
"""

import json
import re
import sys
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_MODELS = {"opus", "sonnet", "haiku", "fable", "inherit"}
# Content must be generalized: no source-project names, no machine-specific paths.
FORBIDDEN = ["vibewarden", "httptape", "fforj", "lgtm", "convoke",
             "/usr/bin/make", "/Users/", "provedoc", "tddoc"]
# Skill trigger phrases -> the one skill whose description must match them.
TRIGGER_CASES = {
    "github-flow": ["open a pr", "merging", "branch", "parallel agents", "issue"],
    "pipeline-setup": ["adopt", "onboard", "status labels", "pipeline.md"],
    "verify": ["smoke-test", "verify", "end-to-end", "running"],
    "audit": ["milestone", "audit", "release"],
    "java-idioms": ["java", "records", "sealed", "immutability"],
}

findings = []


def fail(path, msg):
    findings.append(f"{path.relative_to(ROOT)}: {msg}")


def frontmatter(path):
    text = path.read_text()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not m:
        fail(path, "missing frontmatter block")
        return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            fm[key.strip()] = value.strip()
    return fm, text


def check_agents():
    for path in sorted(ROOT.glob("*/agents/*.md")) + sorted(ROOT.glob("lang/*/agents/*.md")):
        fm, text = frontmatter(path)
        for key in ("name", "description", "tools", "model"):
            if not fm.get(key):
                fail(path, f"frontmatter missing '{key}'")
        if fm.get("model") and fm["model"] not in ALLOWED_MODELS:
            fail(path, f"model must be an alias {sorted(ALLOWED_MODELS)}, got '{fm['model']}'")
        if fm.get("name") == "reviewer":
            tools = {t.strip() for t in fm.get("tools", "").split(",")}
            if tools & {"Write", "Edit"}:
                fail(path, "reviewer must stay read-only (no Write/Edit)")
        if len(text.splitlines()) > 120:
            fail(path, f"agent file too long ({len(text.splitlines())} lines > 120) — move detail to references")


def check_skills():
    for path in sorted(ROOT.glob("*/skills/*/SKILL.md")) + sorted(ROOT.glob("lang/*/skills/*/SKILL.md")):
        fm, _ = frontmatter(path)
        for key in ("name", "description"):
            if not fm.get(key):
                fail(path, f"frontmatter missing '{key}'")
        if fm.get("name") and fm["name"] != path.parent.name:
            fail(path, f"frontmatter name '{fm['name']}' != directory '{path.parent.name}'")


def check_forbidden():
    for path in sorted(ROOT.glob("core/**/*")) + sorted(ROOT.glob("lang/**/*")):
        if not path.is_file() or path.suffix not in {".md", ".js", ".sh", ".json", ".java"}:
            continue
        lower = path.read_text().lower()
        for term in FORBIDDEN:
            if term.lower() in lower:
                fail(path, f"contains project-specific term '{term}' — core/lang content must be generalized")


def check_triggers():
    descriptions = {}
    for path in sorted(ROOT.glob("*/skills/*/SKILL.md")) + sorted(ROOT.glob("lang/*/skills/*/SKILL.md")):
        fm, _ = frontmatter(path)
        if fm.get("name") and fm.get("description"):
            descriptions[fm["name"]] = fm["description"].lower()
    for skill, phrases in TRIGGER_CASES.items():
        desc = descriptions.get(skill)
        if desc is None:
            fail(ROOT / "evals" / "check.py", f"trigger case references unknown skill '{skill}'")
            continue
        for phrase in phrases:
            words = phrase.split()
            if not any(w in desc for w in words):
                fail(ROOT / "evals" / "check.py",
                     f"skill '{skill}' description matches no word of trigger phrase '{phrase}'")
    for (a, da), (b, db) in combinations(descriptions.items(), 2):
        wa, wb = set(re.findall(r"[a-z]{4,}", da)), set(re.findall(r"[a-z]{4,}", db))
        if wa and wb and len(wa & wb) / min(len(wa), len(wb)) > 0.5:
            fail(ROOT / "evals" / "check.py",
                 f"descriptions of '{a}' and '{b}' overlap >50% — routing collision risk")


def check_manifests():
    marketplace = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text())
    for plugin in marketplace["plugins"]:
        src = ROOT / plugin["source"]
        manifest = src / ".claude-plugin" / "plugin.json"
        if not manifest.is_file():
            fail(marketplace and ROOT / ".claude-plugin" / "marketplace.json",
                 f"plugin '{plugin['name']}' source {plugin['source']} has no plugin.json")
            continue
        pj = json.loads(manifest.read_text())
        if pj.get("name") != plugin["name"]:
            fail(manifest, f"name '{pj.get('name')}' != marketplace entry '{plugin['name']}'")
        if not re.match(r"^\d+\.\d+\.\d+$", pj.get("version", "")):
            fail(manifest, "version must be semver")


check_agents()
check_skills()
check_forbidden()
check_triggers()
check_manifests()

if findings:
    print(f"FAIL — {len(findings)} finding(s):")
    for f in findings:
        print(f"  - {f}")
    sys.exit(1)
print("evals green")
