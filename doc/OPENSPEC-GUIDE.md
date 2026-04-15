# OpenSpec Workflow Guide

A practical guide for using the OpenSpec change-management system with Kilo Code in this repository.

---

## What is OpenSpec?

OpenSpec is a structured workflow for proposing and implementing changes. Instead of diving straight into code, you first generate a set of **artifacts** (documents) that clarify _why_, _what_, and _how_ before writing any code.

Each change lives in `openspec/changes/<name>/` and follows the **spec-driven** schema used in this project:

| Artifact | File                         | Question answered                                             |
| -------- | ---------------------------- | ------------------------------------------------------------- |
| Proposal | `proposal.md`                | **Why** this change? What changes at a high level?            |
| Design   | `design.md`                  | **How** will it be implemented? Key decisions and trade-offs. |
| Specs    | `specs/<capability>/spec.md` | **What** must the system do? Testable requirements.           |
| Tasks    | `tasks.md`                   | **Steps** — ordered implementation checklist.                 |

---

## When to Use OpenSpec

**Use it for:**

- Refactoring that touches multiple files or modules
- New features or capabilities
- Dependency changes (adding, removing, upgrading)
- Design decisions that benefit from explicit documentation
- Anything where "why" and "how" are non-obvious

**Skip it for:**

- Typo fixes, single-line patches, cosmetic changes
- Version bumps with no logic change

---

## How Skills Are Triggered

OpenSpec actions are implemented as **Kilo skills** — not slash commands. Kilo automatically loads the right skill when it recognises your intent from the message description. There is no `/command` syntax to type.

**The correct way to trigger each skill:**

| What you want to do        | What to write to Kilo                               |
| -------------------------- | --------------------------------------------------- |
| Propose a new change       | Describe what you want to build (see Step 1 below)  |
| Implement the tasks        | `Implement the change <name>` or `Apply the change` |
| Archive a completed change | `Archive the change <name>`                         |

> If Kilo does not pick up the right skill, be more explicit: _"Use the openspec-propose skill to..."_

---

## Full Workflow

```
┌────────────────────────────────────────────────────────────────────┐
│  1. Describe the change  →  Kilo generates all artifacts           │
│  2. Review & correct     →  Adjust artifacts if needed             │
│  3. "Implement the change <name>"  →  Kilo works through tasks     │
│  4. Review code & tests  →  Validate, iterate if needed            │
│  5. git push             →  Open pull request                      │
│  6. "Archive the change <name>"  →  Merge specs into main tree     │
└────────────────────────────────────────────────────────────────────┘
```

> **Tip:** Use kebab-case for change names: `remove-turf-dependency`, `add-polygon-holes`, `fix-antimeridian-wrap`.

---

## Step-by-Step Prompts

Each step below shows **exactly what to type** in Kilo Code, and what Kilo does in response.

---

### Step 1 — Propose the change

**What you type:**

Write a natural-language message describing the change. Kilo detects the intent and loads the `openspec-propose` skill automatically. Include your context directly in the message:

```
I want to propose a new change: <change-name>

<your context here — see template below>
```

**What Kilo does:**

1. Creates `openspec/changes/<name>/` with a `.openspec.yaml` scaffold
2. Generates `proposal.md` (why & what)
3. Generates `design.md` (how, decisions, risks)
4. Generates `specs/<capability>/spec.md` (requirements + scenarios)
5. Generates `tasks.md` (ordered checklist)
6. Shows a summary and says "Ready for implementation"

**Prompt template:**

```
I want to propose a new change: <change-name>

Change name: <kebab-case-name>

Context:
<Describe the current state — which file, which line, what exists today>

Problem:
<Why does this need to change? What is wrong or missing?>

Approach:
<What solution do you have in mind? List concrete steps if possible>

Constraints:
<Tests must pass? No breaking API changes? Must stay under X ms?>

Out of scope:
<What should Kilo NOT do in this change?>
```

**Real example** (the `remove-turf-dependency` change done in this repo):

```
I want to propose a new change: remove-turf-dependency

Change name: remove-turf-dependency

Context:
@turf/turf is in `dependencies` (package.json line 56) but is only used for:
- `earthRadius` constant imported in src/utils/geometryUtils.ts:1
- Test oracle for distance validation in src/utils/geometryUtils.spec.ts:233
- GeoJSON fixture helpers in src/VisibilityGraph.spec.ts

Problem:
Consumers of the published package transitively install the full turf suite
(several MB of geospatial utilities) even though none of it is needed at runtime.

Approach:
- Define EARTH_RADIUS_METERS = 6_371_008.8 as a local constant in src/utils/constants.ts
  (exact turf value, in metres to avoid /1000 conversions)
- haversineDistance should return metres (distanceMax parameter becomes metres too)
- Move @turf/turf from `dependencies` to `devDependencies`
- Keep turf in tests as a reference oracle — do not rewrite tests

Constraints:
- 100% test coverage must be maintained
- distanceMax unit change (km → m) is an accepted breaking change

Out of scope:
- Removing turf from test files
- Changing the pathfinding algorithms
```

---

### Step 2 — Review and correct artifacts

After `/opsx:propose` finishes, **read each artifact** before touching any code.

**What to check:**

| Artifact      | Questions to ask                                                                     |
| ------------- | ------------------------------------------------------------------------------------ |
| `proposal.md` | Does the "Why" match your intent? Are the listed capabilities correct?               |
| `design.md`   | Do you agree with the decisions? Are alternatives documented?                        |
| `specs/*.md`  | Are requirements testable? Do scenarios use SHALL/WHEN/THEN? Any edge cases missing? |
| `tasks.md`    | Are tasks small enough? Are they in the right order?                                 |

**If something is wrong, tell Kilo directly:**

```
The design chose km as the unit but I want metres. Please update design.md
to document EARTH_RADIUS_METERS = 6_371_008.8 and note that distanceMax
becomes a metre value (breaking change).
```

```
The spec is missing the scenario where distanceMax is set too low
and the search returns an empty path. Please add it.
```

> Fixing artifacts before coding is much cheaper than fixing code after the fact.

---

### Step 3 — Implement the tasks

**What you type:**

```
Implement the change <change-name>.
```

or, if the context is already clear from conversation:

```
Implement the plan above.
```

**What Kilo does:**

1. Reads all context files (proposal, design, specs, tasks)
2. Works through each `- [ ]` task in order
3. Marks tasks `[x]` as it completes them
4. Runs lint, tests, and build as part of the verification tasks
5. Pauses and reports if it hits a blocker

**During apply, you can steer Kilo mid-flight:**

```
The test is comparing in km but we switched to metres — fix the test too.
```

```
Also update the JSDoc on searchAStar and searchDijkstra to say the
parameter is in metres.
```

> Kilo picks up these corrections and continues. You don't need to restart the apply.

---

### Step 4 — Review and validate

Check the output before committing:

```bash
yarn lint
yarn test
yarn build
```

If tests fail or something looks wrong, tell Kilo what you see:

```
The test at geometryUtils.spec.ts:233 still compares in km.
Update it to use { units: 'meters' }.
```

---

### Step 5 — Commit and push

Once you are happy with the result:

```bash
git add .
git diff --staged   # always review before committing
git commit -m "refactor: move @turf/turf to devDependencies, switch distances to metres"
git push origin <branch>
```

> Per project convention: **never commit without reviewing `git diff --staged` first.**

---

### Step 6 — Archive the change (optional but recommended)

When the change is fully implemented and merged, archive it to fold the specs into the main spec tree:

**What you type:**

```
Archive the change <change-name>.
```

**What Kilo does:**

- Merges the capability specs from `openspec/changes/<name>/specs/` into `openspec/specs/`
- Moves the change directory to `openspec/archive/`
- Updates the master spec index

> Archive when: all tasks are `[x]`, tests pass, and the PR is merged (or about to be).
>
> Skip archive if: the change was exploratory or the specs don't add durable value to the project spec tree.

---

## Checking Status at Any Time

```bash
# See which artifacts are done for a change
openspec status --change <change-name>

# Machine-readable JSON (useful for scripting)
openspec status --change <change-name> --json

# List all active changes
openspec list
```

---

## Walkthrough: `remove-turf-dependency`

This change was created in this repository and demonstrates the full lifecycle including mid-flight corrections.

### What was proposed

`@turf/turf` was listed in `dependencies` but only used for the `earthRadius` constant in source code, and as a test oracle. Consumers were forced to transitively install a heavy geospatial library at runtime.

### What the proposal generated

- **`proposal.md`** — Identified the dependency, explained the consumer impact, listed one new capability: `earth-radius-constant`.
- **`design.md`** — Decided to use `EARTH_RADIUS_METERS = 6_371_008.8` (exact turf value) to avoid precision loss. Documented that `distanceMax` becomes a metre value (breaking change accepted). Kept turf in `devDependencies` as a test oracle.
- **`specs/earth-radius-constant/spec.md`** — Two requirements: the constant SHALL equal `6371008.8`, and `@turf/turf` MUST NOT appear in `dependencies`.
- **`tasks.md`** — 9 tasks: create constant, update imports, update `package.json`, run `yarn install`, update tests (unit km→m), update JSDoc, update README, lint, test, build.

### Mid-flight corrections

During the initial proposal, the constant was defined in km (`EARTH_RADIUS_KM = 6371`). After reviewing the design, the decision was made to switch to metres with full turf precision. The artifacts were updated to match before the code was committed.

### Result

- `src/utils/constants.ts` — `EARTH_RADIUS_METERS = 6_371_008.8`
- `src/utils/geometryUtils.ts` — no more turf import; `haversineDistance` returns metres
- `package.json` — turf moved to `devDependencies`
- 77 tests pass at 100% coverage; build succeeds

---

## Quick Reference

| Step      | What to say to Kilo                                | What happens                             |
| --------- | -------------------------------------------------- | ---------------------------------------- |
| Propose   | `I want to propose a new change: <name>` + context | Generates proposal, design, specs, tasks |
| Implement | `Implement the change <name>`                      | Works through all `- [ ]` tasks          |
| Archive   | `Archive the change <name>`                        | Syncs specs, moves to archive            |

```bash
# At any time — check artifact status from the terminal
openspec status --change <change-name>

# List all active changes
openspec list
```

> **Why no `/commands`?** OpenSpec actions are Kilo **skills**, not slash commands. Kilo loads the right skill automatically based on the intent of your message. If it picks the wrong one, be more explicit: _"Use the openspec-archive-change skill for the change remove-turf-dependency."_
