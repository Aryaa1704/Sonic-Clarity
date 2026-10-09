# Contributing to Sonic Clarity

Thank you for your interest in contributing! 🎉

This document outlines how to contribute to Sonic Clarity — a Voice AI Interview Preparation Platform.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Sonic-Clarity.git
   cd Sonic-Clarity
   ```
3. Add the **upstream remote**:
   ```bash
   git remote add upstream https://github.com/Aryaa1704/Sonic-Clarity.git
   ```

---

## Development Setup

```bash
# Install dependencies
bun install

# Copy env file and fill in your values
cp .env.example .env

# Start dev server
bun run dev
```

The app runs at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run lint` | TypeScript type check |
| `bun run preview` | Preview production build |

---

## How to Contribute

### 🐛 Bug Fixes
- Check if the bug is already reported in [Issues](https://github.com/Aryaa1704/Sonic-Clarity/issues)
- If not, open a new issue using the **Bug Report** template
- Once confirmed, create a branch: `fix/describe-the-bug`

### ✨ New Features
- Open a **Feature Request** issue first to discuss
- Wait for maintainer approval before starting work
- Create a branch: `feat/feature-name`

### 📝 Documentation
- Branch name: `docs/what-you-updated`

### 🎨 UI/UX Improvements
- Include screenshots or screen recordings in your PR
- Branch name: `ui/component-name`

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build process, deps update |

**Examples:**
```bash
git commit -m "feat(interview): add pause/resume functionality"
git commit -m "fix(audio): resolve microphone permission issue on Safari"
git commit -m "docs: update deployment guide for Render"
```

---

## Pull Request Process

1. **Sync** with upstream before opening a PR:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Ensure `bun run lint` passes with no errors
3. Ensure `bun run build` succeeds
4. Fill in the **PR template** completely
5. Link related issues with `Closes #<issue-number>`
6. Request review from maintainers

**PRs will be merged once:**
- ✅ All CI checks pass
- ✅ At least 1 maintainer approval
- ✅ No unresolved review comments

---

Thank you for helping make Sonic Clarity better! 🎙️
