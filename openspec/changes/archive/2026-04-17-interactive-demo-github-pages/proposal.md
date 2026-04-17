## Why

GeoPathFinder has no live demonstration that potential users can explore without setting up a local environment. An interactive web demo hosted on GitHub Pages lowers the barrier to discovery and showcases the library's key differentiator — lazy visibility graph construction — in a visual and tangible way.

## What Changes

- New `demo/` directory at repository root containing a standalone Vite + TypeScript application
- New `.github/workflows/deploy-demo.yml` GitHub Actions workflow that builds the demo and deploys it to the `gh-pages` branch on every push to `main`
- 5 predefined scenarios re-using existing GeoJSON fixtures from `test/profiling/` (small, medium, large, xlarge, xxlarge)
- Interactive map (Leaflet + GeoMan) allowing users to draw start point, target points, and polygon obstacles, then run `geopathfinder` from npm and see the computed path overlaid on the map
- Computation time displayed alongside the result (elapsed milliseconds)
- Mobile-aware layout: drawing tools hidden on small screens, predefined scenarios still available

## Capabilities

### New Capabilities

- `demo-app`: Interactive Vite web application embedding geopathfinder, Leaflet and GeoMan; supports free drawing, predefined scenario loading, algorithm selection, distanceMax input, path visualisation and computation time display
- `demo-deployment`: GitHub Actions workflow deploying the built demo to the `gh-pages` branch; GitHub Pages serves from that branch; no commits to `main` required from CI

### Modified Capabilities

_(none — library source and public API are untouched)_

## Impact

- **Library code**: no changes; `src/` is untouched
- **Test suite**: no changes; `test/` GeoJSON fixtures are read-only referenced by the demo, not duplicated
- **Dependencies**: new devDependencies scoped to `demo/package.json` only (`leaflet`, `@geoman-io/geoman-leaflet`, `vite`, `typescript`); root `package.json` unchanged
- **CI**: new workflow file added; existing `ci.yml` pipeline unaffected
- **Branch protections**: deployment targets `gh-pages` branch (no protection rules), so `main` branch protections are not involved
