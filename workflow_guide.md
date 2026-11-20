# Software Engineering Workflow Specification for AI Coding Agents

This document defines the industry-standard Scrum-ban workflow, issue lifecycle, metadata tagging, GitHub automation protocols, and Git branching rules for automated coding agents. Agents MUST adhere to these schema and transition rules to maintain repository hygiene and operational continuity.

---

## 1. Issue Categorisation & Taxonomy

Every incoming issue in the GitHub repository must be categorised using explicit scoped labels. Coding agents use these labels to determine the engineering strategy, test architecture, and commit scope required for the task.

### Issue Types (`type:*`)
*   `type:bug`: Defect reports identifying regressions, runtime errors, or deviations from existing requirements.
*   `type:feature`: Net-new functionality, architectural extensions, or product enhancements.
*   `type:tech-debt`: Refactoring, dependency upgrades, code cleanup, performance optimisations, or test coverage expansion.

### Issue Lifecycle Statuses (`status:*`)
*   `status:raw-intake`: Newly created, unvetted triage issues from external or internal sources. Not ready for development.
*   `status:refining`: Active engineering analysis, task decomposition, or clarification phase. 
*   `status:sprint-worthy`: Meets the Definition of Ready (DoR). Fully scoped, estimated, chunked, and ready for assignment.
*   `status:todo`: Selected for the current sprint cycle and assigned to an agent or developer.
*   `status:in-progress`: Active engineering branch execution.
*   `status:in-review`: Pull Request opened, awaiting peer review or static code analysis hooks.
*   `status:in-testing`: Deployed to a staging/ephemeral environment for end-to-end (E2E) verification.
*   `status:done`: Pull Request successfully merged into the primary branch and the issue is closed.

### Issue Severity & Complexity
*   `priority:critical` | `priority:high` | `priority:medium` | `priority:low`
*   `size:xs` | `size:s` | `size:m` | `size:l` | `size:xl` (Based on modified Fibonacci / T-shirt sizing bounds)

---

## 2. The Backlog Refinement & Sprint Planning Phase

### Backlog Refinement (Grooming)
Coding agents and engineers must transition issues from `status:raw-intake` to `status:sprint-worthy` by enforcing a strict **Definition of Ready (DoR)**. Decide if using the grill-with-docs skill would be useful here to clarify the definition of the issue. An issue is only sprint-worthy if it is:
1.  **Isolated & Small:** Decomposed into the smallest mergeable, atomic unit of work possible.
2.  **Testable:** Contains explicit testing steps, expected outcomes, or specific assertion criteria.
3.  **Scoped:** Clearly defines its bounds, avoiding open-ended requirements.

### Sprint Planning
During the planning meeting, issues are programmatically selected from the `status:sprint-worthy` pool, updated with the current sprint milestone, tagged as `status:todo`, and explicitly assigned to a developer or coding agent ID.

---

## 3. GitHub API Integration Rules for Coding Agents

When executing a task, the agent must perform the following explicit GitHub Actions via the API:

```
[Backlog: status:todo]
       │
       ▼ (Agent polls & assigns to self)
[status:in-progress] ──> (Create Git Branch matching schema)
       │
       ▼ (Execute Code + Run Local Checks)
[status:in-review]   ──> (Open PR with "Closes #XYZ" footer)
       │
       ▼ (CI/CD / Code Review pass)
[status:in-testing]  ──> (Staging Environment Verification)
       │
       ▼ (Merge PR to Main)
[Backlog: status:done] (Automated closing hook triggers)
```

1.  **Poll Assignment:** Query the GitHub API for issues where `assignee=@self` AND `label="status:todo"`.
2.  **State Initialization:** Immediately transition the issue label from `status:todo` to `status:in-progress`.
3.  **Pull Request Linkage:** When the code is pushed, open a Pull Request. The description **MUST** include a linking keyword to the tracking issue (e.g., `Closes #124` or `Fixes #389`) in the footer.
4.  **PR Labeling:** Mirror the issue's `type:*` and `priority:*` tags onto the Pull Request, and set the PR status to `status:in-review`.

---

## 4. Git Branching Strategy

Branch names must follow a strict semantic prefix schema based on the tracking issue type, followed by the issue number and a short, hyphenated description.

| Issue Type | Git Branch Prefix | Example Branch Name |
| :--- | :--- | :--- |
| `type:bug` | `bugfix/` | `bugfix/104-fix-joystick-angle-wraparound` |
| `type:feature` | `feature/` | `feature/211-add-phaser-sound-effects` |
| `type:tech-debt` | `chore/` | `chore/089-remove-warrior-scripting-circular-import` |

---

## 5. Conventional Commits Specification

Coding agents **MUST** format all commit messages according to the Conventional Commits specification. This ensures automated changelog generation and automated semantic version bumping (`major`, `minor`, `patch`).

### Message Structure
```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types Matrix
Agents must map GitHub issue types directly to their corresponding git commit prefixes:

*   **`fix:`**: Used exclusively when fixing a defect (`type:bug`). Maps to a `patch` release.
*   **`feat:`**: Used exclusively when introducing new functionality (`type:feature`). Maps to a `minor` release.
*   **`chore:`**: General maintenance, continuous integration tasks, or build tooling updates (`type:tech-debt`).
*   **`docs:`**: Documentation-only changes (README modifications, inline code comments).
*   **`style:`**: Code style modifications that do not affect runtime functionality (formatting, missing semi-colons, linting fixes).
*   **`refactor:`**: A structural code change that neither fixes a bug nor adds a feature (`type:tech-debt`).
*   **`test:`**: Adding missing tests or correcting existing test suites without changing application code.

### Examples

#### Feature Commit
```text
feat(audio): play sound when phasers fire

Add a fire sound for the player and a distinct one for the opponent,
triggered from firePhasers.

Closes #211
```

#### Bug Fix Commit
```text
fix(touch-controls): handle 0/360 wraparound in joystick turning

Choose the shorter turn direction when the joystick angle crosses the
0/360 boundary so the ship no longer spins the long way round.

Fixes #104
```

#### Breaking Change Notice (Triggers Major Release)
A breaking change must include a `BREAKING CHANGE:` token in the footer description or add an `!` after the type/scope.
```text
refactor(pixelf)!: rename blitSurface to blit

Shorten the surface blitting API to match the rest of the pixelf module.

BREAKING CHANGE: `SURF.blitSurface` is no longer exported; use `SURF.blit`.
```
