## 1. Introduce local Earth-radius constant

- [x] 1.1 Create `src/utils/constants.ts` and export `EARTH_RADIUS_METERS = 6_371_008.8` with a JSDoc comment explaining the value (WGS84 mean radius in metres, matching turf precision)
- [x] 1.2 Update `src/utils/geometryUtils.ts`: replace `import { earthRadius } from '@turf/turf'` with `import { EARTH_RADIUS_METERS } from './constants'`; remove the `/1000` conversion; `haversineDistance` now returns metres
- [x] 1.3 Update tests in `VisibilityGraph.spec.ts`: rename `distanceMaxKm` to `distanceMaxM`, multiply thresholds by 1 000 (`100_000`, `10_000`), switch turf path-length oracle to `{ units: 'meters' }`
- [x] 1.4 Update test in `geometryUtils.spec.ts`: switch turf oracle call to `{ units: 'meters' }`
- [x] 1.5 Update JSDoc on `searchDijkstra` and `searchAStar` in `VisibilityGraph.ts` to state `distanceMax` is in metres
- [x] 1.6 Update README: fix `distanceMax` description and usage examples to metres

## 2. Update package.json dependencies

- [x] 2.1 Remove `"@turf/turf"` from the `dependencies` section in `package.json`
- [x] 2.2 Add `"@turf/turf": "7.2.0"` to the `devDependencies` section in `package.json`
- [x] 2.3 Run `yarn install` to update the lockfile

## 3. Verify correctness

- [x] 3.1 Run `yarn lint` — no ESLint errors or warnings
- [x] 3.2 Run `yarn test` — all tests pass with 100 % coverage
- [x] 3.3 Run `yarn build` — CJS, ESM, and type declaration outputs are produced without error
