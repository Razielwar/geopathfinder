import { readVisibilityGraphInputFromGeoJson } from '../test/visibilityGraphUtils';
import { VisibilityGraph } from '../src/VisibilityGraph';

const scenario = { name: 'XLarge', folder: 'xlarge', distanceMax: 200_000 };

async function runProfilingIterations(targetDurationMs: number = 2000): Promise<void> {
  const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(`test/profiling/${scenario.folder}/visibility-graph-input.geojson`);

  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`                    PROFILING: ${scenario.name} (loop for ${targetDurationMs}ms)`);
  console.log(`══════════════════════════════════════════════════════════════════════════════\n`);

  let totalIterations = 0;
  const startTime = Date.now();

  while (Date.now() - startTime < targetDurationMs) {
    const vg = new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    await vg.search(scenario.distanceMax);
    totalIterations++;
  }

  const elapsed = Date.now() - startTime;

  console.log(`Total iterations: ${totalIterations}`);
  console.log(`Elapsed time: ${elapsed}ms`);
  console.log(`Avg time per iteration: ${(elapsed / totalIterations).toFixed(2)}ms`);
  console.log(`\nRun clinic doctor/flame on this to analyze performance.`);
}

async function main(): Promise<void> {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('                    GEO PATHFINDER PROFILING SESSION');
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log(`\nHeap used before profiling: ${Math.round(process.memoryUsage().heapUsed / (1024 * 1024))} MB`);

  await runProfilingIterations(10000);

  console.log(`\nHeap used after profiling: ${Math.round(process.memoryUsage().heapUsed / (1024 * 1024))} MB`);
  console.log('\nUse clinic doctor/flame to analyze CPU and memory usage in detail.');
}

main().catch((e) => console.error(`Profiling failed: ${e}`));
