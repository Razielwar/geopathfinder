import { readVisibilityGraphInputFromGeoJson } from '../test/visibilityGraphUtils';
import { VisibilityGraph } from '../src/VisibilityGraph';

interface Scenario {
  name: string;
  folder: string;
  distanceMax: number;
  iterations: number;
}

const scenarios: Scenario[] = [
  { name: 'Small', folder: 'small', distanceMax: 100_000, iterations: 100 },
  { name: 'Medium', folder: 'medium', distanceMax: 100_000, iterations: 50 },
  { name: 'Large', folder: 'large', distanceMax: 100_000, iterations: 20 },
  { name: 'XLarge', folder: 'xlarge', distanceMax: 200_000, iterations: 10 },
  { name: 'XXLarge', folder: 'xxlarge', distanceMax: 300_000, iterations: 10 },
];

interface BenchmarkStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  opsPerSec: number;
}

function computeStats(times: number[]): BenchmarkStats {
  times.sort((a, b) => a - b);
  const min = times[0]!;
  const max = times[times.length - 1]!;
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)]!;
  return {
    min,
    max,
    avg,
    median,
    opsPerSec: 1000 / avg,
  };
}

function benchmarkGraphConstruction(scenario: Scenario): void {
  const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(`test/profiling/${scenario.folder}/visibility-graph-input.geojson`);

  const times: number[] = [];

  for (let i = 0; i < scenario.iterations; i++) {
    const start = performance.now();
    new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    const end = performance.now();
    times.push(end - start);
  }

  const stats = computeStats(times);

  console.log(`  Graph construction (${scenario.iterations} iterations):`);
  console.log(
    `    min: ${stats.min.toFixed(3)}ms, max: ${stats.max.toFixed(3)}ms, avg: ${stats.avg.toFixed(3)}ms, median: ${stats.median.toFixed(3)}ms`
  );
  console.log(`    ops/sec: ${stats.opsPerSec.toFixed(0)}`);
}

async function benchmarkAStarSearch(scenario: Scenario): Promise<void> {
  const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(`test/profiling/${scenario.folder}/visibility-graph-input.geojson`);

  const iterations = Math.min(scenario.iterations, 10);

  for (let i = 0; i < iterations; i++) {
    const vg = new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    await vg.searchAStar(scenario.distanceMax);
  }

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const vg = new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    const start = performance.now();
    await vg.searchAStar(scenario.distanceMax);
    const end = performance.now();
    times.push(end - start);
  }

  const stats = computeStats(times);

  console.log(`  A* search (${iterations} iterations):`);
  console.log(
    `    min: ${stats.min.toFixed(3)}ms, max: ${stats.max.toFixed(3)}ms, avg: ${stats.avg.toFixed(3)}ms, median: ${stats.median.toFixed(3)}ms`
  );
  console.log(`    ops/sec: ${stats.opsPerSec.toFixed(0)}`);
}

async function benchmarkDijkstraSearch(scenario: Scenario): Promise<void> {
  const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(`test/profiling/${scenario.folder}/visibility-graph-input.geojson`);

  const iterations = Math.min(scenario.iterations, 10);

  for (let i = 0; i < iterations; i++) {
    const vg = new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    await vg.searchDijkstra(scenario.distanceMax);
  }

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const vg = new VisibilityGraph(visibilityGraphInput.start, visibilityGraphInput.restrictedAreas, visibilityGraphInput.targets);
    const start = performance.now();
    await vg.searchDijkstra(scenario.distanceMax);
    const end = performance.now();
    times.push(end - start);
  }

  const stats = computeStats(times);

  console.log(`  Dijkstra search (${iterations} iterations):`);
  console.log(
    `    min: ${stats.min.toFixed(3)}ms, max: ${stats.max.toFixed(3)}ms, avg: ${stats.avg.toFixed(3)}ms, median: ${stats.median.toFixed(3)}ms`
  );
  console.log(`    ops/sec: ${stats.opsPerSec.toFixed(0)}`);
}

async function main(): Promise<void> {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('                         GEOPATHFINDER BENCHMARK                                ');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  for (const scenario of scenarios) {
    console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
    console.log(`  Scenario: ${scenario.name} (${scenario.folder})`);
    console.log('══════════════════════════════════════════════════════════════════════════════');

    try {
      benchmarkGraphConstruction(scenario);
      await benchmarkAStarSearch(scenario);
      await benchmarkDijkstraSearch(scenario);
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('                              BENCHMARK COMPLETE                                ');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
