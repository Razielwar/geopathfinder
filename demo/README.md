# GeoPathFinder Demo

Interactive browser demo for the [geopathfinder](https://www.npmjs.com/package/geopathfinder) library, deployed at:

**https://razielwar.github.io/geopathfinder/**

## Prerequisites

- Node.js `^24`
- Yarn `^4` (managed via Corepack)

```bash
corepack enable
```

## Local Setup

```bash
# From the demo/ directory
yarn install
```

## Running the Dev Server

```bash
yarn dev
```

Opens at `http://localhost:5173`. The Vite base path is automatically set to `/` for local development.

## Building for Production

```bash
yarn build
```

Output is written to `../docs/` (repository root). This is the directory uploaded to GitHub Pages.

## Previewing the Production Build

```bash
yarn preview
```

Serves the built `docs/` folder locally at `http://localhost:4173/geopathfinder/`.

## Scenario File Format

Predefined scenarios live in `public/scenarios/` and are standard GeoJSON `FeatureCollection` files. The demo recognises three feature types:

| `properties.type` | Geometry  | Role              |
| ----------------- | --------- | ----------------- |
| `"StartPoint"`    | `Point`   | Search start      |
| `"LandingPoint"`  | `Point`   | Search target     |
| _(any)_           | `Polygon` | Obstacle to avoid |

The scenario index is at `public/scenarios/index.json` and lists all available scenarios with their `id`, `label`, and `file` path.

## One-Time GitHub Pages Configuration

After the first successful run of the `deploy-demo.yml` workflow, enable GitHub Pages in the repository settings:

1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

The demo will then be live at `https://razielwar.github.io/geopathfinder/`.

> **Note:** The `gh-pages` branch (if it exists) is managed entirely by GitHub infrastructure when using the GitHub Actions source. Do not push to it manually.
