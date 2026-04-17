## 1. Demo Project Scaffold

- [x] 1.1 Create `demo/` directory with `package.json` (dependencies: `geopathfinder`, `leaflet`, `@geoman-io/geoman-leaflet`; devDependencies: `vite`, `typescript`, `@types/leaflet`, `@types/geojson`)
- [x] 1.2 Create `demo/tsconfig.json` (strict mode, target ESNext, lib DOM)
- [x] 1.3 Create `demo/vite.config.ts` with `base: '/geopathfinder/'` for production and `base: '/'` override for dev via `VITE_BASE_URL` env var; set `outDir: '../docs'`
- [x] 1.4 Add `dev`, `build`, and `preview` scripts to `demo/package.json`
- [x] 1.5 Run `yarn install` inside `demo/` and verify it resolves without errors

## 2. Scenario Static Assets

- [x] 2.1 Copy `test/profiling/small/visibility-graph-input.geojson` → `demo/public/scenarios/small.geojson`
- [x] 2.2 Copy `test/profiling/medium/visibility-graph-input.geojson` → `demo/public/scenarios/medium.geojson`
- [x] 2.3 Copy `test/profiling/large/visibility-graph-input.geojson` → `demo/public/scenarios/large.geojson`
- [x] 2.4 Copy `test/profiling/xlarge/visibility-graph-input.geojson` → `demo/public/scenarios/xlarge.geojson`
- [x] 2.5 Copy `test/profiling/xxlarge/visibility-graph-input.geojson` → `demo/public/scenarios/xxlarge.geojson`
- [x] 2.6 Create `demo/public/scenarios/index.json` listing all 5 scenarios with `id`, `label`, and `file` fields

## 3. HTML Entry Point & Styles

- [x] 3.1 Create `demo/index.html` with map container `<div id="map">`, control panel `<div id="controls">`, result panel `<div id="result">`, and script tag pointing to `src/main.ts`
- [x] 3.2 Create `demo/src/styles.css` with full-viewport map layout, control panel positioning, mobile media query hiding GeoMan toolbar (≤ 768 px), and mobile notice element styling

## 4. Map Initialisation

- [x] 4.1 Create `demo/src/map/mapManager.ts`: initialise Leaflet map centred on Europe (lat 48, lon 10, zoom 5) with OSM tile layer
- [x] 4.2 Integrate `@geoman-io/geoman-leaflet` into `mapManager.ts`: enable draw controls for Marker (start) and Polygon (obstacle); configure two separate Marker tools — one for start point, one for target point — using GeoMan custom options or separate layer groups
- [x] 4.3 Implement internal state in `mapManager.ts`: `startPoint: Feature<Point> | null`, `targets: Feature<Point>[]`, `obstacles: Feature<Polygon>[]`; enforce single-start-point rule (remove previous on new draw)
- [x] 4.4 Wire GeoMan `pm:create` and `pm:remove` events to update internal state and re-render layer styles (start = blue marker, target = green marker, obstacle = grey polygon)

## 5. Scenario Loader

- [x] 5.1 Create `demo/src/scenarios/loader.ts`: fetch `scenarios/index.json`, return typed scenario list
- [x] 5.2 Implement `loadScenario(file: string)` in `loader.ts`: fetch the GeoJSON file, parse features using `properties.type === 'StartPoint'` / `'LandingPoint'` / Polygon geometry convention, and call `mapManager.loadScenario(...)` to clear and repopulate the map
- [x] 5.3 Populate the scenario dropdown in `demo/src/ui/controls.ts` on page load by calling `loader.ts`; prepend a "Custom" option as default value; do NOT attach an `onChange` handler — loading is triggered only by the "Load Scenario" button
- [x] 5.4 Implement "Load Scenario" button handler: if "Custom" selected → call `mapManager.clearAll()`; otherwise call `loadScenario(file)` then reset the dropdown label to the scenario name (remove any "(modified)" suffix)
- [x] 5.5 Implement modified-state tracking in `mapManager.ts`: expose an `onMapEdited` callback; fire it whenever a feature is drawn or deleted; in `controls.ts`, subscribe to `onMapEdited` to append " (modified)" to the current scenario dropdown label when the selected value is not "Custom"

## 6. Control Panel UI

- [x] 6.1 Create `demo/src/ui/controls.ts`: render scenario dropdown (Custom + 5 scenarios) + "Load Scenario" button, distanceMax input (default 5000000), algorithm dropdown (`a*` / `dijkstra`), Search button, Clear button, and mobile notice element
- [x] 6.2 Implement Clear button handler: call `mapManager.clearAll()` (removes all layers and resets state), clear the result panel, and reset the scenario dropdown to "Custom"
- [x] 6.3 Add mobile notice: CSS class toggled via media query already hides the GeoMan toolbar; insert a `<p class="mobile-notice">` element visible only at ≤ 768 px

## 7. Search Execution

- [x] 7.1 Create `demo/src/search/runner.ts`: validate presence of start point and ≥ 1 target before running; show error in result panel if validation fails
- [x] 7.2 Implement `runSearch()` in `runner.ts`: disable Search button, show loading indicator, call `new VisibilityGraph(start, obstacles, targets)` from `geopathfinder`, then `await graph.search(distanceMax, { shortestPathAlgorithm })`; measure elapsed time with `performance.now()`
- [x] 7.3 On successful result with path.length ≥ 2: remove previous result polyline, draw new Leaflet `Polyline` on the map, display elapsed time and waypoint count in result panel
- [x] 7.4 On result with empty path: display "No path found within [distanceMax] m — Computed in [ms] ms" in result panel
- [x] 7.5 On thrown error: display error message in result panel
- [x] 7.6 In all cases (success, empty, error): re-enable Search button and hide loading indicator in a `finally` block

## 8. Application Entry Point

- [x] 8.1 Create `demo/src/main.ts`: import `styles.css`, initialise map (`mapManager`), wire controls (`controls.ts`), attach Search button click to `runSearch()`, load scenario list on startup
- [x] 8.2 Verify `yarn dev` starts without TypeScript errors and the demo is usable end-to-end in the browser (draw start, target, obstacle → search → path displayed)
- [x] 8.3 Verify `yarn build` produces the `docs/` output with no errors and all assets resolve correctly when served locally via `yarn preview`

## 9. GitHub Actions Deployment Workflow

- [x] 9.1 Create `.github/workflows/deploy-demo.yml`: trigger on `push` to `main`; set `permissions: pages: write, id-token: write`
- [x] 9.2 Add job steps: `actions/checkout@v4`, reuse `.github/actions/setup-node-with-cache` action for Node setup, `yarn install` inside `demo/`, `yarn build` inside `demo/`
- [x] 9.3 Add deployment steps: `actions/upload-pages-artifact@v3` (path: `docs/`), `actions/deploy-pages@v4` with environment `github-pages`
- [x] 9.4 Verify workflow YAML is valid (lint with `actionlint` or push to branch and check Actions tab)

## 11. Auto-zoom on scenario load

- [x] 11.1 Add "Auto-zoom on scenario load" requirement to `specs/demo-app/spec.md`
- [x] 11.2 Implement auto-zoom in `mapManager.loadScenario()`: collect all latlngs from loaded features, call `map.fitBounds()` with 40 px padding after all layers are added

## 10. Documentation

- [x] 10.1 Create `demo/README.md` documenting: prerequisites, `yarn install`, `yarn dev`, `yarn build`, `yarn preview`, scenario file format, and the one-time GitHub Pages configuration step (Settings → Pages → Source → GitHub Actions)
- [x] 10.2 Add a "Demo" section to the root `README.md` with the GitHub Pages URL and a one-line description
