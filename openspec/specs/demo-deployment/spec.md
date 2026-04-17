## ADDED Requirements

### Requirement: Demo source structure

The demo source SHALL live in a `demo/` directory at the repository root. It SHALL be a standalone Vite + TypeScript project with its own `package.json` and lockfile, entirely independent of the root `package.json`.

#### Scenario: Local dev server starts

- **WHEN** the developer runs `yarn install && yarn dev` from the `demo/` directory
- **THEN** a local Vite dev server starts and the demo is accessible at `http://localhost:5173`

#### Scenario: Local build succeeds

- **WHEN** the developer runs `yarn build` from the `demo/` directory
- **THEN** Vite produces a static bundle in `docs/` at the repository root with no errors

---

### Requirement: Vite base path configuration

The Vite build SHALL set `base: '/geopathfinder/'` so that all asset URLs are correct when served from `https://razielwar.github.io/geopathfinder/`. The local dev server SHALL use `base: '/'`.

#### Scenario: Assets load correctly on GitHub Pages

- **WHEN** the built demo is served from `https://razielwar.github.io/geopathfinder/`
- **THEN** all JS, CSS, and static assets (scenario JSON files) resolve correctly with no 404 errors

---

### Requirement: Scenario fixtures bundled as static assets

The 5 GeoJSON input fixtures from `test/profiling/*/visibility-graph-input.geojson` SHALL be copied into `demo/public/scenarios/` (as `small.geojson`, `medium.geojson`, `large.geojson`, `xlarge.geojson`, `xxlarge.geojson`) and served as static assets. A `demo/public/scenarios/index.json` file SHALL list the available scenarios with their display names and file paths.

#### Scenario: Scenario files served as static assets

- **WHEN** the built demo is deployed
- **THEN** `GET /geopathfinder/scenarios/small.geojson` (and the other four) returns a valid GeoJSON FeatureCollection

#### Scenario: Index file lists all scenarios

- **WHEN** the demo fetches `scenarios/index.json`
- **THEN** the response contains exactly 5 entries, one per profiling fixture

---

### Requirement: GitHub Actions deployment workflow

A workflow file at `.github/workflows/deploy-demo.yml` SHALL build the demo and deploy it to the `gh-pages` branch on every push to `main`. The workflow SHALL NOT commit to `main` or modify any protected branch.

#### Scenario: Workflow triggers on push to main

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the `deploy-demo.yml` workflow is triggered automatically

#### Scenario: Workflow builds the demo

- **WHEN** the workflow runs
- **THEN** it installs demo dependencies (`yarn install` inside `demo/`) and runs `yarn build`, producing output in `docs/`

#### Scenario: Workflow deploys to GitHub Pages

- **WHEN** the build step completes without errors
- **THEN** the workflow uploads the `docs/` directory as a Pages artifact and deploys it using `actions/deploy-pages`; the `gh-pages` branch is updated by GitHub infrastructure (not by a `git push` from the workflow)

#### Scenario: Deployment does not touch main branch

- **WHEN** the workflow deploys to GitHub Pages
- **THEN** no commit is made to `main` or any other protected branch

---

### Requirement: GitHub Pages configuration

GitHub Pages SHALL be configured to use the **GitHub Actions** source (not branch/folder source). This is a one-time manual step documented in the demo README.

#### Scenario: Demo accessible after configuration

- **WHEN** GitHub Pages is configured to deploy via GitHub Actions and the workflow has run successfully
- **THEN** the demo is accessible at `https://razielwar.github.io/geopathfinder/`

---

### Requirement: Demo README

A `demo/README.md` file SHALL document: local setup steps, dev server command, build command, scenario format, and the one-time GitHub Pages configuration step.

#### Scenario: README covers local setup

- **WHEN** a developer reads `demo/README.md`
- **THEN** they can follow the instructions to run the demo locally without additional guidance
