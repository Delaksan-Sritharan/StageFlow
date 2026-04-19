# Contributing to StageFlow

Thank you for your interest in contributing. This document explains the process for reporting bugs, proposing features, and submitting code changes.

## Before you start

- Search [existing issues](../../issues) to make sure your bug or idea has not already been reported.
- For large changes, open a discussion issue first so the direction can be agreed before you invest time writing code.

## Workflow

### 1. Open an issue

Every contribution starts with an issue. Do not open a pull request without a linked issue unless it is a trivial typo fix.

Use the appropriate label when creating your issue:

| Label | When to use |
|---|---|
| `bug` | Something is broken or behaving incorrectly |
| `feature` | A new capability you want added |
| `improvement` | An enhancement to something that already exists |
| `docs` | Documentation only changes |
| `question` | You need clarification before deciding whether to file a bug or feature |

Write a clear title and description. For bugs, include steps to reproduce, what you expected, and what actually happened.

### 2. Get assigned

Wait to be assigned to the issue before starting work. This prevents two people from solving the same problem at the same time.

Leave a comment on the issue saying you would like to work on it. A maintainer will assign it to you, usually within a couple of days. If there is no response after five days, feel free to follow up.

**Do not open a pull request for an issue that is already assigned to someone else.**

### 3. Fork and branch

Fork the repository and create a branch from `main`. Name your branch after the issue number and a short description:

```
git checkout -b 42-fix-timer-sync
```

Keep your branch focused on one issue. Do not bundle unrelated changes.

### 4. Make your changes

- Follow the existing code style (TypeScript, Tailwind CSS, Next.js App Router conventions).
- Do not add comments that explain what the code does — use clear names instead. Only add a comment when the reason behind something is non-obvious.
- Do not introduce new dependencies without discussing it in the issue first.
- If your change touches the database schema, add a migration SQL file under `supabase/` following the naming pattern of existing files.
- Run `npm run lint` and fix all warnings before committing.

### 5. Commit messages

Write short, present-tense commit messages that describe what the commit does:

```
fix: correct timer elapsed calculation after pause
feat: add toast notification on feedback submission
docs: update contributing guide
```

Use the `fix:`, `feat:`, `docs:`, `refactor:`, or `chore:` prefix.

### 6. Open a pull request

Push your branch and open a pull request against `main`. In the PR description:

- Reference the issue with `Closes #<issue-number>`.
- Summarise what changed and why.
- List any manual testing steps the reviewer should follow.

Keep PRs small. A focused PR that changes one thing is reviewed faster and merged sooner than a large one that changes many.

### 7. Review and merge

A maintainer will review your PR. Address all requested changes. Once approved, a maintainer will merge it — do not merge your own PR.

## Code of conduct

- Be respectful and constructive in all issue and PR comments.
- No harassment, discrimination, or personal attacks of any kind.
- Disagreements about code are fine; keep them about the code, not the person.
- If you see a violation, report it by emailing the maintainers directly.

Violations may result in removal from the project.

## Questions

If you are unsure about something, open a `question` issue or leave a comment on the relevant issue before writing any code. It is always better to ask first.
