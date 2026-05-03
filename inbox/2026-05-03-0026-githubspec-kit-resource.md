---
captured_at: 2026-05-03T00:26:16.269Z
source: web
kind: resource
url: "https://github.com/github/spec-kit"
title: "github/spec-kit"
scan_kind: github-repo
---
# github/spec-kit

[Original](https://github.com/github/spec-kit)

## Caption

An agentic coding editor git repo

## Scan

💫 Toolkit to help you get started with Spec-Driven Development
_Python · 92,191★ · MIT License · updated 2026-05-01_

## README

<div align="center">
    <img src="./media/logo_large.webp" alt="Spec Kit Logo" width="200" height="200"/>
    <h1>🌱 Spec Kit</h1>
    <h3><em>Build high-quality software faster.</em></h3>
</div>

<p align="center">
    <strong>An open source toolkit that allows you to focus on product scenarios and predictable outcomes instead of vibe coding every piece from scratch.</strong>
</p>

<p align="center">
    <a href="https://github.com/github/spec-kit/releases/latest"><img src="https://img.shields.io/github/v/release/github/spec-kit" alt="Latest Release"/></a>
    <a href="https://github.com/github/spec-kit/stargazers"><img src="https://img.shields.io/github/stars/github/spec-kit?style=social" alt="GitHub stars"/></a>
    <a href="https://github.com/github/spec-kit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/github/spec-kit" alt="License"/></a>
    <a href="https://github.github.io/spec-kit/"><img src="https://img.shields.io/badge/docs-GitHub_Pages-blue" alt="Documentation"/></a>
</p>

---

## Table of Contents

- [🤔 What is Spec-Driven Development?](#-what-is-spec-driven-development)
- [⚡ Get Started](#-get-started)
- [📽️ Video Overview](#️-video-overview)
- [🧩 Community Extensions](#-community-extensions)
- [🎨 Community Presets](#-community-presets)
- [🚶 Community Walkthroughs](#-community-walkthroughs)
- [🛠️ Community Friends](#️-community-friends)
- [🤖 Supported AI Coding Agent Integrations](#-supported-ai-coding-agent-integrations)
- [🔧 Specify CLI Reference](#-specify-cli-reference)
- [🧩 Making Spec Kit Your Own: Extensions & Presets](#-making-spec-kit-your-own-extensions--presets)
- [📚 Core Philosophy](#-core-philosophy)
- [🌟 Development Phases](#-development-phases)
- [🎯 Experimental Goals](#-experimental-goals)
- [🔧 Prerequisites](#-prerequisites)
- [📖 Learn More](#-learn-more)
- [📋 Detailed Process](#-detailed-process)
- [🔍 Troubleshooting](#-troubleshooting)
- [💬 Support](#-support)
- [🙏 Acknowledgements](#-acknowledgements)
- [📄 License](#-license)

## 🤔 What is Spec-Driven Development?

Spec-Driven Development **flips the script** on traditional software development. For decades, code has been king — specifications were just scaffolding we built and discarded once the "real work" of coding began. Spec-Driven Development changes this: **specifications become executable**, directly generating working implementations rather than just guiding them.

## ⚡ Get Started

### 1. Install Specify CLI

Choose your preferred installation method:

> **Important:** The only official, maintained packages for Spec Kit are published from this GitHub repository. Any packages with the same name on PyPI are **not** affiliated with this project and are not maintained by the Spec Kit maintainers. Always install directly from GitHub as shown below.

#### Option 1: Persistent Installation (Recommended)

Install once and use everywhere. Pin a specific release tag for stability (check [Releases](https://github.com/github/spec-kit/releases) for the latest):

```bash
# Install a specific stable release (recommended — replace vX.Y.Z with the latest tag)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z

# Or install latest from main (may include unreleased changes)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Alternative: using pipx (also works)
pipx install git+https://github.com/github/spec-kit.git@vX.Y.Z
pipx install git+https://github.com/github/spec-kit.git
```

Then verify the correct version is installed:

```bash
specify version
```

And use the tool directly:

```bash
# Create new project
specify init <PROJECT_NAME>

# Or initialize in existing project
specify init . --integration copilot
# or
specify init --here --integration copilot

# Check installed tools
specify check
```

To upgrade Specify, see the [Upgrade Guide](./docs/upgrade.md) for detailed instructions. Quick upgrade:

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@vX.Y.Z
# pipx users: pipx install --force git+https://github.com/github/spec-kit.git@vX.Y.Z
```

#### Option 2: One-time Usage

Run directly without installing:

```bash
# Create new project (pinned to a stable release — replace vX.Y.Z with the latest tag)
uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init <PROJECT_NAME>

# Or initialize in existing project
uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init . --integration copilot
# or
uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init --here --integration copilot
```

**Benefits of persistent installation:**

- Tool stays installed and available in PATH
- No need to create shell aliases
- Better tool management with `uv tool list`, `uv tool upgrade`, `uv tool uninstall`
- Cleaner shell configuration

#### Option 3: Enterprise / Air-Gapped Installation

If your environment blocks access to PyPI or GitHub, see the [Enterprise / Air-Gapped Installation](./docs/installation.md#enterprise--air-gapped-installation) guide for step-by-step instructions on using `pip download` to create portable, OS-specific wheel bundles on a connected machine.

### 2. Establish project principles

Launch your coding agent in the project directory. Most agents expose spec-kit as `/speckit.*` slash commands; Codex CLI in skills mode uses `$speckit-*` instead.

Use the **`/speckit.constitution`** command to create your project's governing principles and development guidelines that will guide all subsequent development.

```bash
/speckit.constitution Create principles focused on code quality, testing standards, user experience consistency, and performance requirements
```

### 3. Create the spec

Use the **`/speckit.specify`** command to describe what you want to build. Focus on the **what** and **why**, not the tech stack.

```bash
/speckit.specify Build an application that can help me organize my photos in separate photo albums. Albums are grouped by date and can be re-organized by dragging and dropping on the main page. Albums are never in other nested albums. Within each album, photos are previewed in a tile-like interface.
```

### 4. Create a technical implementation plan

Use the **`/speckit.plan`** command to provide your tech stack and architecture choices.

```bash
/speckit.plan The application uses Vite with minimal number of libraries. Use vanilla HTML, CSS, and JavaScript as much as possible. Images are not uploaded anywhere and metadata is stored in a local SQLite database.
```

### 5. Break down into tasks

Use **`/speckit.tasks`** to create an actionable task list from your implementation plan.

```bash
/speckit.tasks
```

### 6. Execute implementation

Use **`/speckit.implement`** to execute all tasks and build your feature according to the plan.

```bash
/speckit.implement
```

For detailed step-by-step instructions, see our [comprehensive guide](./spec-driven.md).

## 📽️ Video Overview

Want to see Spec Kit in action? Watch our [video overview](https://www.youtube.com/watch?v=a9eR1xsfvHg&pp=0gcJCckJAYcqIYzv)!

[![Spec Kit video header](/media/spec-kit-video-header.jpg)](https://www.youtube.com/watch?v=a9eR1xsfvHg&pp=0gcJCckJAYcqIYzv)

## 🧩 Community Extensions

> [!NOTE]
> Community extensions are independently created and maintained by their respective authors. GitHub and the Spec Kit maintainers may review pull requests that add entries to the community catalog for formatting, catalog structure, or policy compliance, but they do **not review, audit, endorse, or support the extension code itself**. The Community Extensions website is also a third-party resource. Review extension source code before installation and use at your own discretion.

🔍 **Browse and search community extensions on the [Community Extensions website](https://speckit-community.github.io/extensions/).**

The following community-contributed extensions are available in [`catalog.community.json`]

_[README truncated, 47610 chars omitted]_
