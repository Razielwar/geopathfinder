## ADDED Requirements

### Requirement: EARTH_RADIUS_METERS constant is defined locally

The library SHALL define the WGS84 mean Earth radius as a named, exported constant `EARTH_RADIUS_METERS` with the value `6371008.8` (metres, matching the turf `earthRadius` constant) in `src/utils/constants.ts`, independently of any third-party package.

#### Scenario: Constant is available as a named export

- **WHEN** a module imports `EARTH_RADIUS_METERS` from `src/utils/constants`
- **THEN** the imported value MUST equal `6371008.8`

#### Scenario: Constant is used by haversine distance calculation

- **WHEN** `haversineDistance` is called with two geographic points
- **THEN** the computation MUST use `EARTH_RADIUS_METERS` from `src/utils/constants` and NOT import any value from `@turf/turf`
- **AND** the returned distance MUST be expressed in metres

### Requirement: @turf/turf is not a production dependency

The library SHALL NOT list `@turf/turf` as a runtime dependency (i.e., it MUST NOT appear in the `dependencies` section of `package.json`).

#### Scenario: Package consumers do not receive turf as a transitive dependency

- **WHEN** a consumer installs `geopathfinder` from the npm registry
- **THEN** `@turf/turf` MUST NOT be installed as a transitive dependency

#### Scenario: @turf/turf is available for tests

- **WHEN** the test suite is executed in the development environment
- **THEN** `@turf/turf` MUST be resolvable (listed in `devDependencies`) and the test oracle assertions MUST pass
