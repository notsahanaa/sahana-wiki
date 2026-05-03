---
captured_at: 2026-05-03T00:29:23.342Z
source: web
kind: resource
url: "https://crew.logic.inc/"
title: "crew — package manager for agent skills"
scan_kind: clip
---
# crew — package manager for agent skills

[Original](https://crew.logic.inc/)

## Caption

Agent Skill Packages

## Scan

A package manager for agent skills

## $ crew install <skill>

## `crew` helps teams share agent skills.

Install skills for yourself or create a shared tap for your team. Crew will keep your skills up to date.

~/work · zsh

$crew install founding-engineer

 ✓claude-code  → ~/.claude/skills/founding-engineer

 ✓codex        → ~/.agents/skills/founding-engineer

 ✓gemini-cli   → ~/.agents/skills/founding-engineer

 installed in 5 agents · 0 skipped · 0 failed

$crew tap add @acme/skills

 ✓cloned acme → 42 skills searchable

$crew install acme/team-baseline

 ✓resolved 14 dependencies from tap acme

 ✓installed team baseline across every detected agent

$crew autoupdate enable

 ✓checking every 4 hours

$

Installs intoclaude-codecodexcursorgemini-cligoose

[and 12 others →](https://crew.logic.inc/#agents)

§ 02  **Installation**

## Install Crew

$ curl -fsSL https://crew.logic.inc/install.sh | sh
$ crew version
crew 0.3.1 (darwin-arm64)

Requires macOS 13+

A single binary. Drops itself in `~/.local/bin/crew`, plus whatever skills you install go under `~/.crew/` and into your agents' skills directories. Nothing else. Uninstall with `rm -rf ~/.crew && rm ~/.local/bin/crew`.

What is Crew?

## Crew treats agent skills like packages.

Install one skill for yourself, publish a repo for your team, or tap into a shared collection. Git is the package index; `SKILL.md` is the manifest.

**multi-agent** · one install, every detected agent**team taps** · private git repos become registries**no telemetry** · crew never phones home

§

01

  

**Why crew**

The best prompts and agent playbooks often live as copied folders, gists, or private notes. Crew gives them install commands, source tracking, update behavior, and a git-native way to share them without a hosted registry.

01

/

use your own

### Install skills without manual copying.

Point crew at a local directory, a git repo, or a tap entry. It validates the `SKILL.md`, copies it into the right agent directories, and records what it wrote.

02

/

share with a team

### Your skills repo is your registry.

Point crew at a shared repo — a _tap_ — and everyone pulls the same skills, reviewed in PRs and versioned in git. A baseline skill can onboard a new laptop in one command.

03

/

stay current

### Update skills like packages.

`crew update` refreshes taps, resolves refs to commit SHAs, skips pinned skills, and refuses to overwrite local edits unless you explicitly force it.

§

03

  

**How it works**

## Find, install, update. Repeat.

Five everyday motions. No proprietary manifest, no hosted account, no per-agent setup loop — just commands that do what they say.

01

#### Find great skills.

Search across your private taps, your team's repo, the default `core` collection, and anything else you've added. Your personal library and shared team library use the same command.

02

#### Tap into more sources.

A _tap_ is any git repo full of skills. Add your team's repo, a community collection, your own private one — `crew tap add` once, and every skill inside is searchable and installable.

03

#### Install into every agent.

One `crew install` copies the skill into Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Goose, and every other supported agent detected on your machine. Grab one skill, a local folder, a git repo, or a whole tap.

04

#### Dependencies, handled.

Skills can depend on other skills. Crew walks the graph and installs everything they need. A single "team baseline" meta-skill can pull in a dozen others in one command.

05

#### Stay current automatically.

`crew update` pulls the latest versions of everything. Flip on autoupdate and a background job keeps every agent fresh in the background.

§

04

  

**Skill references**

## Three ways to point at a skill.

A reference is anything you can hand to `crew install` — and anything another skill can list as a dependency. The grammar is small on purpose.

#### Local path

./my-skill

A directory on your machine. Detected by leading `./`, `../`, `/`, or `~`. Tilde expands, relatives resolve against `cwd`.

-   crew install ./founding-engineer
-   crew install ~/code/team-skills/code-review

#### Git source

@owner/repo

Any reachable git URL. No tap setup required. `@owner/repo` is GitHub shorthand; full `https://` and `git@` URLs work for anywhere else. Append `@ref` to pin, `//subpath` to scope.

-   crew install @acme/skills
-   crew install @acme/skills@v1.2.0
-   crew install @acme/skills//engineers/founding

#### Tap source

founding-engineer

A skill inside a configured tap. Bare names search every tap — including the default `core` tap, which ships with a curated set of battle-tested skills. Qualify with `tap/name` to be explicit. Pin with `@v1.0`.

-   crew install founding-engineer
-   crew install core/founding-engineer
-   crew install acme/code-review@v1.0

§

05

  

**A day with crew**

## The commands you'll use most.

Search, install, update, repeat.

\# Find a skill across every tap you've added.
$ crew search engineer
3 matches for "engineer"
  core
    founding-engineer  Ship like a founding engineer: bias to action, small PRs, obvious code.
    staff-engineer     Design docs, RFC etiquette, cross-team technical leadership.
  acme
    platform-engineer  Team conventions for infra work and on-call handoffs.

\# Install one — it lands in every agent on your machine.
$ crew install founding-engineer
✓ founding-engineer@a1b2c3d installed in 5 agents

\# Install straight from a repo, pinned to a tag, at a subpath.
$ crew install @acme/skills@v1.2.0//engineers/founding

\# See what's installed.
$ crew list
Installed skills (3)
  founding-engineer   core         a1b2c3d   5 agents
  code-review         core         d4e5f6a   5 agents
  platform-engineer   acme@v1.2.0  9c8b7a6   5 agents
  Run \`crew info <name>\` to see more about any of these.

\# Pull the latest versions of everything.
$ crew update
✓ founding-engineer a1b2c3d → e8f9a01 (5 agents)
✓ code-review up to date
✓ platform-engineer pinned @ v1.2.0, skipped

\# Run crew update in the background every 4 hours.
$ crew autoupdate enable
✓ Autoupdate enabled
  checking every 4 hours
  see progress in \`crew autoupdate status\`

§

06

  

**Command reference**

## Everything the CLI can do.

Every command accepts `--scope`, `--agent`, `--dry-run`, `--json`, `--quiet`, `--verbose`, `--yes`, and `--force` where they apply. Run `crew help <command>` for examples.

-   [Managing skills05](https://crew.logic.inc/#cmd-managing)
-   [Discovery05](https://crew.logic.inc/#cmd-discovery)
-   [Agents & automation06](https://crew.logic.inc/#cmd-agents)
-   [Housekeeping03](https://crew.logic.inc/#cmd-housekeeping)
-   [Meta02](https://crew.logic.inc/#cmd-meta)

### Managing skills

crew install <ref>…

Install one or more skills into every detected agent.

crew uninstall <name>…

Remove installed skills from every agent they were installed into.

crew update \[<name>…\]

Update all installed skills, or only those named. Pinned SHAs are skipped unless

\--force.

crew list

List installed skills, grouped by scope, with sources and resolved SHAs.

crew info <ref-or-name>

Show details for an installed skill or one available in a tap.

### Discovery

crew search \[<query>\]

Case-insensitive substring match across every configured tap. With no query, lists every installable skill — installed ones are marked `✓`.

crew tap add <git-url> \[name\]

Clone a registry into `~/.crew/taps/`. Name defaults to the repo name.

crew tap remove <name>

Delete a local tap clone and drop it from config.

crew tap list

Print each tap's name, URL, and last-fetched timestamp.

crew tap update \[<name>…\]

Fetch + fast-forward every git tap (or the named subset). Doesn't touch installed skills — use `crew update` for that.

### Agents & automation

crew agents

List detected agents and whether they're enabled, disabled, or forced.

crew agents enable <name>

Force-enable an agent even if auto-detection misses it.

crew agents disable <name>

Skip this agent on all install and update operations.

crew autoupdate enable \[--interval\]

Install a launchd user agent that runs `crew update --quiet` on an interval (default 4h).

crew autoupdate disable

Unload and remove the background update agent.

crew autoupdate status

Whether active, last run, next run, configured interval.

### Housekeeping

crew doctor \[--verify\] \[--repair\]

Check integrity between state, markers, and agent directories.

\--repair fixes recoverable drift without ever touching customized files.

crew cache clean

Remove ephemeral caches and unreferenced store entries.

crew self-update \[--check\]

Upgrade the `crew` binary itself to the latest release.

\--check reports without downloading.

§

07

  

**Taps**

## A tap is just a git repo full of skills.

No hosted registry, no server, no account. Your personal skills repo, team repo, or public collection _is_ the package index. Fork it, branch it, review it in pull requests, and `crew update` pulls it like any other.

Repository shape

acme-skills/
├── README.md              \# optional, informational
├── founding-engineer/
│   └── SKILL.md
├── code-review/
│   └── SKILL.md
├── platform-engineer/
│   ├── SKILL.md
│   └── playbook.md
└── docs/
    └── contributing.md    \# ignored by crew search

Any top-level directory with a valid `SKILL.md` is a skill. Everything else is ignored. Prefer to keep skills under a `skills/` directory? That works too — if `skills/` exists, crew indexes its children instead of the root.

Group related skills into **namespaces**: `skills/marketing/*`, `skills/engineering/*`. Then `crew install marketing` installs the whole bundle, and `crew install acme/marketing/email-outreach` picks one.

Day one for a new teammate

$ crew tap add @acme/skills
✓ cloned acme → ~/.crew/taps/acme (42 skills)

$ crew install acme/team-baseline
\# meta-skill pulling in everything the team considers standard
\# (e.g. founding-engineer, code-review, pr-descriptions, on-call…)
✓ resolved 14 dependencies
✓ installed across every detected agent

$ crew autoupdate enable
✓ agent loaded · keeps skills current every 4h

A meta-skill is an ordinary skill whose body describes the team's conventions and whose `dependencies` list pulls in the rest. The same pattern works for a solo baseline: one command to recreate your preferred agent setup on a new Mac.

§

08

  

**For teams**

## Turn team know-how into installable skills.

Your team's best agent playbooks should not be trapped on one engineer's laptop. Crew turns a private git repo into a shared package source that people install from, review in PRs, and keep in sync without another internal service.

One repo, every laptop

### Your team's skills repo is your registry.

Point crew at a private GitHub repo once. Every new skill that lands on `main` shows up in everyone's `crew search`. No internal tool to build. No package server to run.

Onboarding, one command

### New hires are productive on day one.

Publish a `team-baseline` meta-skill that depends on everything you consider standard — review checklists, on-call playbooks, style guides. A single `crew install` catches them up.

Review in PRs

### Skills get better like code does.

Propose a change to the team's prompt library the same way you propose a change to anything else — a branch, a PR, comments, squash-merge. Everyone pulls the update on their next `crew update`.

Private by default

### Internal stays internal.

Crew clones taps with whatever git credentials you already have. Your private repo stays private — crew never phones home, never uploads, never indexes anything outside the machines you install it on.

\# Monday, 9:04am. A new engineer opens their laptop.
$ crew tap add @acme/skills
✓ cloned acme → 42 skills available

$ crew install acme/team-baseline
✓ resolved 14 dependencies
✓ installed across every detected agent

\# Monday, 9:06am. They know how the team ships code.

§

09

  

**Safety model**

## Crew is a file copier.

Crew is a file copier. It doesn't execute your skills, your taps, or anything they pull in. It leaves a paper trail you can audit, and it refuses to overwrite anything it didn't install itself.

fs

#### No symlinks, ever.

Every install is a file copy. Upgrades atomically rename into place. You can `rm -rf` a skill with no side effects.

exec

#### Never executes anything.

No post-install hooks, no build steps, no user-supplied scripts run by crew. It copies files. Agents are what run them.

marker

#### Tracks what it wrote.

Every installed skill gets a `.crew.json` marker with its source, ref, SHA, and content hash. Removing a skill removes only what crew created.

diff

#### Detects your edits.

On re-install, crew re-hashes the destination. If you've customized a managed skill, the install is refused — unless you pass `--force`.

lock

#### Concurrency-safe.

Every write takes an advisory lock on `state.json.lock`. The background autoupdater and your interactive shell can't stomp on each other.

sha

#### Reproducible versions.

Tags and branches resolve to full 40-char commit SHAs at install time. The SHA — not the tag — is what's recorded.

scope

#### Owns only ~/.crew/.

Crew writes to its own directory and to each agent's skills directory. It won't touch your global `AGENTS.md`, settings JSON, or anything else.

doctor

#### Auditable.

`crew doctor` reconciles state, markers, and agent directories. `--repair` fixes drift without ever touching files you edited.

§

10

  

**Anatomy of a skill**

## No proprietary manifest. Just `SKILL.md`.

Crew reads the [agent skills specification](https://agentskills.io/specification) directly. Crew-specific metadata lives under `metadata.crew` so the skill stays fully spec-compliant — readable by any agent, not just the ones crew installs into.

\---
name: founding-engineer
description: Ship like a founding engineer. Use when scoping, writing, or reviewing code at an early-stage company.
license: MIT
metadata:
  crew:
    homepage: https://github.com/jane/founding-engineer
    dependencies:
      - code-review
      - @acme/skills//code-review@v1.0
---

\# Founding engineer mode

Bias to action. The second-best solution shipped this week beats the
perfect one shipped next month. Prefer small, obvious PRs over clever
ones. Delete code aggressively. Write the boring version first.

\# ...the rest of the skill body is whatever the agent needs to read.

homepage

Shown by `crew info` so people can find your docs.

dependencies

Other skills to pull in — by name, git URL, or path. Walked transitively.

versions

Every install pins to a git commit SHA. Pin to a tag with `@v1.0`.

§

11

  

**FAQ**

How is this different from skills.sh or \`gh skill\`?

They're great projects too — different takes on the same problem. Crew leans hard into team workflows. A few things that are particular to crew:

-   **Taps.** Point crew at a git repo once; every skill in it is searchable and installable. You can even just install the entire tap, and as skills are added to that tap, they'll get added to your machine when you run `crew update`.
-   **Skill dependencies.** Skills can depend on other skills. Crew walks the graph and installs everything they need. A single `team-baseline` meta-skill can pull in a dozen others.
-   **Background autoupdate.** `crew autoupdate enable` sets up a launchd agent that keeps every skill current.
-   **Local-edit protection.** Crew hashes what it installs and refuses to clobber your edits on re-install — so you can tweak a skill in place and not lose your work the next time something updates.
-   **Private-first.** Crew clones taps with whatever git credentials are on the machine — SSH, GitHub tokens, Enterprise hosts. No hosted middleman.

Is crew useful if I don't have a team?

Yes. Crew is still a package manager for your own skills. Install a skill once and it lands in every detected agent. Add your personal skills repo as a tap and your library becomes searchable. Use a baseline skill to recreate your setup on a new Mac.

The team features are the same primitives scaled up: git sources, taps, dependency resolution, source tracking, autoupdate, and local-edit protection.

How does crew work with a private team skills repo?

Same as any private git repo you clone. Add it as a tap: `crew tap add git@github.com:acme/skills.git`. Crew uses whatever credentials your git already has — SSH keys, personal access tokens, GitHub Enterprise hosts. Nothing gets uploaded anywhere; there's no intermediary registry.

Every `main`\-merge automatically becomes installable team-wide. Pair it with `crew autoupdate enable` and every Mac pulls approved skill updates on the next interval.

Skills can depend on other skills?

Yes. A `SKILL.md`'s frontmatter can list `metadata.crew.dependencies` — an array of skill references in any form the CLI accepts. Crew walks the graph transitively and installs every dep before the parent.

The most useful pattern is a "meta-skill" — a single skill whose body describes a team's conventions and whose `dependencies` list pulls in the real working skills. Onboarding a new engineer becomes one command.

Does one install really cover every coding agent?

Yes. `crew install founding-engineer` copies the skill into Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Goose, and every other [supported agent](https://crew.logic.inc/#agents) detected on the machine. Agents that share a convention (e.g. most read `~/.agents/skills/`) get one physical copy; the install summary reports each adapter by name.

Don't have one of them? It's skipped silently. Add the agent later, run `crew update`, and it catches up.

Why copies instead of symlinks?

Symlinks break the moment two agents resolve a skill differently, or a user pins one agent to an older ref. Copies are dumb, predictable, and safe: each agent's directory is self-sufficient. The marginal disk cost is negligible — skills are markdown.

What happens if I edit an installed skill?

Crew records a content hash in the `.crew.json` marker at install time. On the next `crew install` or `crew update`, it recomputes the hash. If it differs, crew refuses to overwrite your changes and reports `customized`. You pass `--force` to override, or copy your edits into a new skill and install that instead.

Is there a hosted registry?

No. The default tap `core` is a plain git repo. Anyone can host a tap — your team, your company, yourself. Crew never phones home or uploads your skills.

What about Linux? Windows?

Future work. The v1 spec is macOS-only because launchd is the autoupdate mechanism and each agent adapter encodes platform-specific paths. Nothing in the core design is Mac-specific; it's a scope decision, not a technical one.

§

12

  

**Agents**

## Works with every Mac agent that speaks the spec.

Any agent coder that reads the [agent skills spec](https://agentskills.io/specification) is a valid target. Crew auto-detects the ones you already have and quietly skips the rest.

ampAmp

autohandAutohand

claude-codeClaude Code

codexCodex

command-codeCommand Code

cursorCursor

factoryFactory

gemini-cliGemini CLI

github-copilotGitHub Copilot

gooseGoose

junieJunie

kiroKiro

mistral-vibeMistral Vibe

nanobotNanobot

opencodeOpenCode

pipi

roo-codeRoo Code

Don't see yours? Its adapter probably takes an afternoon to write — [§7.1](https://github.com/with-logic/crew/blob/main/PRD.md#71-adapter-operations) in the PRD walks you through it.
