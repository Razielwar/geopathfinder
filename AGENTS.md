# GeoPathFinder Agent Instructions

**Project:** TypeScript library for geodesic-aware pathfinding using visibility graphs with GeoJSON inputs.

## Language

- **All code and documentation must be written in English.** This includes comments, commit messages, and documentation files.

## Commands

| Task                      | Command                                               |
| ------------------------- | ----------------------------------------------------- |
| Build (CJS + ESM + types) | `yarn build`                                          |
| Test with coverage        | `yarn test`                                           |
| Test watch mode           | `yarn test:watch`                                     |
| Lint                      | `yarn lint`                                           |
| Format & lint fix         | `yarn lint:fix` && `yarn format`                      |
| Clean & rebuild           | `yarn clean && yarn build`                            |
| Benchmark                 | `yarn bench`                                          |
| Profile (CPU/heap/flame)  | `yarn clinic:doctor` / `clinic:flame` / `clinic:heap` |

## Pre-commit & CI Flow

- **Pre-commit hook** runs `yarn lint-staged` (lints & formats changed files)
- **CI order** (`.github/workflows/ci.yml`): lint → test → build → semantic-release (main branch only)
- **Semantic versioning** uses ESLint conventional changelog preset; commits determine version bump

## Build & Output

- **tsconfig.json** → CommonJS to `dist/cjs`
- **tsconfig.esm.json** → ES modules to `dist/esm`
- **Declaration files** → `dist/types`
- **Main entry** is `dist/cjs/index.js`; npm package publishes entire `dist/` folder

## Testing

- **Jest** with 100% coverage threshold (branches, functions, lines, statements)
- **Test pattern** is `**/*.spec.ts`
- **Single test file** max workers set to 1 (`maxWorkers: 1` in jest.config.ts)
- **Timeout** is 15 seconds per test
- **Test setup** requires building with `yarn build:test` before running profiling/benchmark tools

## Coverage Rules

- **100% coverage is MANDATORY** to finalize any change. Never mark a change as complete if coverage drops below 100%.
- **@istanbul ignore** comments are **FORBIDDEN**. Use proper test cases instead of ignoring coverage.

## TypeScript & Linting

- **Strict mode** enabled; `noImplicitReturns`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` all enforced
- **Naming convention**: public/protected members camelCase, private members prefixed with underscore
- **Imports** must be type-annotated where applicable (`@typescript-eslint/consistent-type-imports`)
- **ESLint** runs TypeScript type checking via `tsconfig.eslint.json`
- **Prettier** runs as a linting rule (warns on format violations)

## Code Style Constraints

- **Private member prefix** required: `_property` (checked at lint time)
- **Explicit accessibility modifiers** required on class members
- **No implicit any** (warn level)

## Key Source Layout

```
src/
├─ VisibilityGraph.ts       # Main class; handles visibility graph & A* search
├─ VisibilityGraph.spec.ts  # Test suite (100% coverage required)
├─ model/                   # NodePoint, Edge data structures
├─ utils/
│  ├─ geometryUtils.ts      # Haversine, tangent, intersection, clockwise checks
│  └─ FlatQueue.ts          # Priority queue for A* algorithm
└─ index.ts                 # Public exports
```

## Important Implementation Details

- **Event loop blocking mitigation**: Long operations call `waitNextEventloopCycle()` to yield control; see comment in VisibilityGraph.ts:11-21
- **TODO items in code**: Point wrapping at ±180 longitude and ±90 latitude not yet handled; inner polygons (holes) not yet supported
- **Performance characteristic**: Visibility graph built on-demand (step-by-step) during search, not pre-computed; this is the key performance advantage

## Node & Yarn Versions

- **Node** `^24.13.1`
- **Yarn** `^4.13.0` (latest stable, managed via Corepack)

## Commit Validation

**NEVER commit without user's prior validation.** After `git add`, run `git diff --staged` and wait for confirmation before `git commit`.

## Release

- Semantic-release on main branch push only
- Tag format: `${version}` (e.g., `1.2.3`)
- Auto-updates `CHANGELOG.md`, `package.json`, `yarn.lock`
- Publishes to npm as public package
