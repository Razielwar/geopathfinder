## Why

`@turf/turf` is currently listed as a production dependency (`dependencies`) but is only used for two purposes: the `earthRadius` constant in `geometryUtils.ts` (production code) and as a test oracle for distance and GeoJSON feature construction in the spec files. Shipping a heavy geospatial library to end-users who only need pathfinding results in unnecessary bundle overhead and a wider attack surface.

## What Changes

- Extract the Earth-radius constant from `@turf/turf` into a local `EARTH_RADIUS_KM` constant inside the library's utility layer.
- Move `@turf/turf` from `dependencies` to `devDependencies` so it is no longer bundled or required by consumers of the published package.
- No public API changes; this is a pure internal refactoring.

## Capabilities

### New Capabilities

- `earth-radius-constant`: A named, exported constant `EARTH_RADIUS_KM` (6 371 km, WGS84 mean radius) replaces the runtime import from `@turf/turf` in the geometry utilities.

### Modified Capabilities

<!-- No existing spec-level behaviour changes. The haversine formula, pathfinding algorithms, and all other capabilities remain functionally identical. -->

## Impact

- **Source code**: `src/utils/geometryUtils.ts` — import removed, constant sourced locally.
- **New file**: `src/utils/constants.ts` — exports `EARTH_RADIUS_KM`.
- **Dependencies**: `@turf/turf` removed from `dependencies`, added to `devDependencies`.
- **Published package**: consumers no longer transitively depend on `@turf/turf`.
- **Tests**: unchanged; `@turf/turf` remains available at test-time via `devDependencies`.
