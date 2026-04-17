import { VisibilityGraph } from 'geopathfinder';
import type { MapManager } from '../map/mapManager';
import type { ControlRefs } from '../ui/controls';
import { showResult } from '../ui/controls';

export async function runSearch(mapManager: MapManager, refs: ControlRefs): Promise<void> {
  const { searchButton, loadingIndicator, distanceMaxInput, algorithmSelect, resultPanel } = refs;

  // ── Validate inputs ─────────────────────────────────────────────────────────
  const start = mapManager.startPoint;
  if (start === null) {
    showResult(resultPanel, 'A start point is required. Draw one on the map first.', 'error');
    return;
  }

  const targets = mapManager.targets;
  if (targets.length === 0) {
    showResult(resultPanel, 'At least one target point is required. Draw one on the map first.', 'error');
    return;
  }

  const distanceMax = Number(distanceMaxInput.value);
  if (!Number.isFinite(distanceMax) || distanceMax <= 0) {
    showResult(resultPanel, 'Max distance must be a positive number.', 'error');
    return;
  }

  const algorithmValue = algorithmSelect.value;
  const shortestPathAlgorithm: 'a*' | 'dijkstra' = algorithmValue === 'dijkstra' ? 'dijkstra' : 'a*';

  // ── Run search ──────────────────────────────────────────────────────────────
  searchButton.disabled = true;
  loadingIndicator.className = 'loading visible';

  const t0 = performance.now();

  try {
    const graph = new VisibilityGraph(start, mapManager.obstacles, targets);
    const path = await graph.search(distanceMax, { shortestPathAlgorithm });
    const elapsed = Math.round(performance.now() - t0);

    if (path.length >= 2) {
      mapManager.drawResultPath(path as [number, number][]);
      showResult(resultPanel, `Path found — ${path.length} waypoints\nComputed in ${elapsed} ms`, 'success');
    } else {
      mapManager.clearResultPath();
      showResult(resultPanel, `No path found within ${distanceMax} m — Computed in ${elapsed} ms`, 'info');
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - t0);
    mapManager.clearResultPath();
    showResult(resultPanel, `Error: ${err instanceof Error ? err.message : String(err)} (${elapsed} ms)`, 'error');
  } finally {
    searchButton.disabled = false;
    loadingIndicator.className = 'loading';
  }
}
