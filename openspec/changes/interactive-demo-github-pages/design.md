## Context

GeoPathFinder is a published npm library with no hosted demonstration. Prospective users must install the package, write code, and run it locally to evaluate it. The repository already contains 5 rich GeoJSON fixtures in `test/profiling/` (small, medium, large, xlarge, xxlarge) that cover a spectrum of complexity and are already used by the profiling and benchmark infrastructure. The demo must not require any server-side runtime — it must be a fully static single-page application so that GitHub Pages can serve it from the `gh-pages` branch.

The main branch carries protection rules that prevent direct CI commits. This constraint ruled out any approach that commits generated files back to `main` (as was already problematic for semantic-release).

## Goals / Non-Goals

**Goals:**

- Deliver a zero-install hosted demo at `https://razielwar.github.io/geopathfinder/`
- Reuse the 5 existing profiling GeoJSON fixtures as predefined scenarios without duplication
- Allow free-form drawing of start point, targets, and polygon obstacles via GeoMan
- Display the computed path and elapsed computation time after each search
- Adapt the UI for mobile (hide drawing tools, keep scenario loader)
- Automate build and deployment via GitHub Actions on every push to `main`, without touching `main` branch protections

**Non-Goals:**

- Real-time collaborative editing or persistence across sessions
- Server-side computation (library runs entirely in the browser)
- Coverage or test requirements on the demo application itself
- Support for MultiPolygon drawing in the demo (library supports it; demo draw is polygon-only)
- Modifying the library source or public API

## Decisions

### Decision 1 — Deploy to `gh-pages` branch, not `docs/` folder on `main`

**Choice:** Dedicated `gh-pages` branch, managed exclusively by CI.

**Alternative considered:** Committing the Vite build output into a `docs/` folder on `main` and pointing GitHub Pages at that folder.

**Rejected because:** The `main` branch has protection rules. Committing build artifacts from CI would require bypassing those rules (as already experienced with semantic-release). The `gh-pages` branch has no protection rules, so GitHub Actions can push to it freely using `GITHUB_TOKEN` without any special setup.

### Decision 2 — Standalone `demo/package.json`, not merged into root

**Choice:** `demo/` is a self-contained Vite project with its own `package.json` and lockfile.

**Alternative considered:** Adding demo devDependencies (Leaflet, GeoMan, Vite) to the root `package.json`.

**Rejected because:** The root package is a published library. Merging demo tooling into it pollutes the library's dependency surface, inflates `node_modules` for library consumers, and risks interfering with the existing lint/build/test pipeline. A standalone `demo/package.json` keeps concerns fully separated.

### Decision 3 — Vite with vanilla TypeScript, no frontend framework

**Choice:** Vite bundler + plain TypeScript + DOM APIs.

**Alternative considered:** React or Vue wrapper for component structure.

**Rejected because:** The demo is a single page with a map and a control panel. A component framework adds bundle size and complexity with no meaningful benefit at this scope. Vite alone provides hot-reload, ESM bundling, and TypeScript support. Bundle size stays small, which matters for a GitHub Pages static site.

### Decision 4 — `geopathfinder` consumed from npm, not local build

**Choice:** Import `geopathfinder` as a regular npm dependency inside `demo/package.json`.

**Alternative considered:** Path-alias pointing to `../dist/` or `../src/`.

**Rejected because:** The demo is a public showcase of the published package, not a development harness. Using the npm version ensures the demo always reflects what users actually install. It also avoids forcing demo consumers to run `yarn build` on the library first.

### Decision 5 — GeoJSON fixtures copied into `demo/public/scenarios/` at build time

**Choice:** The 5 profiling GeoJSON files (`test/profiling/*/visibility-graph-input.geojson`) are copied into `demo/public/scenarios/` via a Vite `publicDir` or a pre-build copy step, and a `scenarios.json` index file describes the available scenarios.

**Alternative considered:** Fetching the files from raw GitHub URLs at runtime (e.g. `https://raw.githubusercontent.com/...`).

**Rejected because:** Raw GitHub URLs are not a stable CDN and introduce a network dependency. Bundling the fixtures as static assets makes the demo fully self-contained and reliably fast.

The fixtures are NOT duplicated in `test/` — they remain owned by `test/profiling/`. The copy step in the build process (or Vite config) moves them to `demo/public/` only for the purpose of the static bundle.

### Decision 6 — Computation time measured with `performance.now()`

**Choice:** Wrap the `await graph.search(...)` call with `performance.now()` before and after; display elapsed milliseconds in the result panel.

**Alternative considered:** `Date.now()` timestamps.

**Rejected because:** `performance.now()` provides sub-millisecond precision and is not subject to system clock adjustments. It is available in all modern browsers and in the Node.js environments used by the demo's dev/build toolchain.

### Decision 7 — Mobile layout hides GeoMan drawing toolbar

**Choice:** CSS media query (`max-width: 768px`) hides the GeoMan toolbar and shows a notice directing mobile users to load a predefined scenario.

**Alternative considered:** Fully disabling GeoMan on mobile via JS and re-rendering the control panel.

**Rejected because:** CSS-only hiding is simpler, avoids conditional GeoMan initialisation paths, and can be toggled without re-mounting the map. The GeoMan instance is still initialised (no code branching needed) but its toolbar is invisible. Drawn features from GeoMan are still captured if a user manages to draw via other means; no data loss occurs.

## Risks / Trade-offs

[geopathfinder runs synchronously on the main thread for small inputs, but for xlarge/xxlarge scenarios the search may block the UI for hundreds of milliseconds] → Display a loading spinner and disable the Search button while the `await graph.search(...)` Promise is pending. The library already yields to the event loop every 10 iterations (see `VisibilityGraph.ts:11-21`), so the UI remains partially responsive.

[Vite's `base` path must match the GitHub Pages sub-path `/geopathfinder/`] → Set `base: '/geopathfinder/'` in `vite.config.ts`. Failure to do so causes blank pages because asset paths are absolute from `/`. Local `vite dev` uses `base: '/'` via an env variable override.

[GeoJSON from `test/profiling/` uses `LandingPoint` / `StartPoint` property conventions that are internal to the test harness] → The demo's scenario loader reads features using the same property-based detection logic as `test/visibilityGraphUtils.ts` (`type === 'StartPoint'`, `type === 'LandingPoint'`), ensuring compatibility without duplicating the parsing logic in library code.

[`gh-pages` branch is force-pushed by CI on every deploy, losing any manual changes] → Document clearly that the `gh-pages` branch is CI-owned and must not be edited manually.

## Migration Plan

1. Implement `demo/` application and `deploy-demo.yml` workflow on the `docs/demo-sample` branch.
2. Open a PR to `main`; standard CI (`ci.yml`) runs lint + test + build on library code as usual.
3. After merge to `main`, the new `deploy-demo.yml` workflow triggers automatically.
4. In the repository Settings → Pages, set Source to **GitHub Actions** (one-time manual step).
5. Verify the demo is live at `https://razielwar.github.io/geopathfinder/`.

**Rollback:** Disable GitHub Pages in repository Settings → Pages. No library code is affected.

## Open Questions

_(none — all decisions resolved above)_
