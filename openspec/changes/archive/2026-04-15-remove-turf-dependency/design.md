## Context

`@turf/turf` was imported in `src/utils/geometryUtils.ts` solely to obtain `earthRadius` (6 371 008.8 m, the WGS84 mean Earth radius). The value was divided by 1 000 and stored as a km constant used in the haversine formula.

In the test suite, `@turf/turf` is used as a reference oracle: `turf.distance()` validates haversine results (`geometryUtils.spec.ts:233-234`) and several turf helpers (`point`, `lineString`, `featureCollection`, `length`) are used for fixture construction and path-length verification in `VisibilityGraph.spec.ts`.

Because `@turf/turf` was in `dependencies`, every consumer of the published npm package transitively installed the full turf suite, which is several megabytes of geospatial utilities unrelated to pathfinding.

## Goals / Non-Goals

**Goals:**

- Remove `@turf/turf` from `dependencies` so it is not installed by consumers of the package.
- Introduce a locally-defined `EARTH_RADIUS_METERS` constant (6 371 008.8 m, turf-identical precision) to replace the turf import.
- Export the constant from `src/utils/constants.ts` to provide a single source of truth.
- Switch `haversineDistance` to return **metres** throughout, eliminating the intermediate `/1000` conversion.
- Keep `@turf/turf` available at test time via `devDependencies`.
- Maintain 100 % test coverage and a passing build after the change.

**Non-Goals:**

- Removing turf from the dev environment or from test files.
- Supporting dynamic or ellipsoidal Earth-radius models (WGS84 mean radius is sufficient for the haversine approximation already in use).

## Decisions

### Decision 1: Use metres as the canonical distance unit

**Chosen approach**: define `EARTH_RADIUS_METERS = 6_371_008.8` in `src/utils/constants.ts`; `haversineDistance` returns metres; `distanceMax` parameter on `searchAStar`/`searchDijkstra` is expressed in metres.

**Alternative considered**: keep kilometres (6 371 km, rounded) as the unit, preserving the previous API. Rejected because:

- Metres are the SI base unit — they avoid the implicit `/1000` conversion in `geometryUtils.ts`.
- Using the full-precision turf value (6 371 008.8 m) avoids a 9 m rounding error per Earth radius (~0.00014 % relative), making the local constant byte-for-byte equivalent to the turf source.
- Floating-point arithmetic on integer-scale metre values is less prone to accumulated rounding error than on fractional kilometre values for short distances.

**Trade-off**: `distanceMax` changes unit from km to m — this is a **breaking change** to the public API, accepted intentionally.

### Decision 2: Place the constant in a new `src/utils/constants.ts` module

**Chosen approach**: create `src/utils/constants.ts` and export `EARTH_RADIUS_METERS` from there.

**Alternative considered**: inline the constant directly into `geometryUtils.ts` as a private (non-exported) value. Rejected because a dedicated constants module makes the value discoverable and provides a single source of truth for other geometry utilities that may need it in the future.

### Decision 3: Keep `@turf/turf` in `devDependencies`

**Chosen approach**: move the package entry from `dependencies` to `devDependencies` in `package.json`.

**Alternative considered**: remove turf entirely, rewriting the test assertions with a hand-rolled haversine reference. Rejected because turf's `distance()` function is a well-maintained external oracle — keeping it as a test reference adds confidence that our haversine implementation is correct. Its presence in `devDependencies` imposes no cost on package consumers.

## Risks / Trade-offs

- [Changing `distanceMax` unit from km to m is a breaking change for existing callers] -> Documented explicitly in CHANGELOG and README. Callers must multiply existing values by 1 000.
- [Consumers who were relying on turf being a transitive dependency of geopathfinder will lose it] -> This is the intended outcome; the public API shape (types, method signatures) is otherwise unchanged.

## Migration Plan

Already implemented:

1. Created `src/utils/constants.ts` with `export const EARTH_RADIUS_METERS = 6_371_008.8`.
2. Updated `src/utils/geometryUtils.ts`: replaced turf import with `import { EARTH_RADIUS_METERS } from './constants'`; removed the `/1000` conversion; `haversineDistance` now returns metres.
3. Moved `"@turf/turf": "7.2.0"` from `dependencies` to `devDependencies` in `package.json`.
4. Ran `yarn install` to update the lockfile.
5. Updated test thresholds in `VisibilityGraph.spec.ts` from km to m (`100_000`, `10_000`); updated turf oracle unit to `'meters'` in `geometryUtils.spec.ts`.
6. Updated README `distanceMax` documentation and examples.

**Rollback**: revert the above file changes and run `yarn install`; no data migration required.

## Open Questions

None — all decisions are resolved and implemented.
