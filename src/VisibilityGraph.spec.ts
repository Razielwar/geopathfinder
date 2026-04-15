import { expect, describe, it } from '@jest/globals';

import * as turf from '@turf/turf';
import { loadFeatureCollection } from '../test/geojsonUtils';
import {
  readVisibilityGraphInputFromGeoJson,
  buildSearchGeojsonResult,
  buildFeatureCollectionFromVisibilityGraphData,
  buildFeatureCollectionFromProcessingVisibilityLines,
} from '../test/visibilityGraphUtils';
import { VisibilityGraph } from './VisibilityGraph';

describe('VisibilityGraph Test', () => {
  describe('VisibilityGraph constructor test', () => {
    /**
     * should get the startPoint, the targets, extract the edges from the polygons and identify concave points
     */
    it.each([
      ['Simple graph short with only one target', 'simple'],
      ['Simple graph multi polygon', 'simple-multi-polygon'],
      ['Simple graph multi target', 'simple-multi-target'],
      ['Complex graph short with only one target', 'complex'],
    ])('Visibility graph construction should extract correctly data from input - %s', (description, folderPath) => {
      const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(
        `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
      );
      const visibilityGraph = new VisibilityGraph(
        visibilityGraphInput.start,
        visibilityGraphInput.restrictedAreas,
        visibilityGraphInput.targets
      );
      const visibilityGraphData = buildFeatureCollectionFromVisibilityGraphData(visibilityGraph);
      // uncomment to regenerate expected result
      // saveFeatureCollection(`test/visibilityGraph/${folderPath}/visibility-graph-data-expected.geojson`, visibilityGraphData);
      const visibilityGraphDataExpected = loadFeatureCollection(
        `test/visibilityGraph/${folderPath}/visibility-graph-data-expected.geojson`
      );
      expect(visibilityGraphData).toEqual(visibilityGraphDataExpected);
    });
  });

  describe('VisibilityGraph processPointChildren test', () => {
    /**
     * should build all the visibility lines ignoring concave points and line entering in polygons
     */
    it.each([
      ['Simple graph short with only one target', 'simple'],
      ['Simple graph multi polygon', 'simple-multi-polygon'],
      ['Simple graph multi target', 'simple-multi-target'],
      ['Complex graph short with only one target', 'complex'],
    ])('Calling processChildrenPoint works correctly - %s', (description, folderPath) => {
      const { visibilityGraphInput, featureCollection } = readVisibilityGraphInputFromGeoJson(
        `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
      );
      const visibilityGraph = new VisibilityGraph(
        visibilityGraphInput.start,
        visibilityGraphInput.restrictedAreas,
        visibilityGraphInput.targets
      );
      const visibilityGraphDataVisibilyLines = buildFeatureCollectionFromProcessingVisibilityLines(visibilityGraph, featureCollection);
      // uncomment to regenerate expected result
      // saveFeatureCollection(`test/visibilityGraph/${folderPath}/visibility-graph-visibility-lines-expected.geojson`, visibilityGraphDataVisibilyLines);
      const visibilityGraphDataExpected = loadFeatureCollection(
        `test/visibilityGraph/${folderPath}/visibility-graph-visibility-lines-expected.geojson`
      );
      expect(visibilityGraphDataVisibilyLines).toEqual(visibilityGraphDataExpected);
    });
  });

  describe.each([
    ['Dijkstra', true],
    ['AStar', false],
  ])('VisibilityGraph search test - %s', (_: string, isDijkstra: boolean) => {
    /**
     * should get the startPoint, the targets, extract the edges from the polygons and identify concave points
     */
    it.each([
      ['Simple graph short with only one target', 'simple', 100_000],
      ['Simple graph multi polygon', 'simple-multi-polygon', 100_000],
      ['Simple graph multi target', 'simple-multi-target', 100_000],
      ['Complex graph short with only one target', 'complex', 100_000],
    ])(
      'Calling search should return optimal path to target - %s',
      async (description: string, folderPath: string, distanceMaxM: number) => {
        const { visibilityGraphInput, featureCollection } = readVisibilityGraphInputFromGeoJson(
          `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
        );
        const visibilityGraph = new VisibilityGraph(
          visibilityGraphInput.start,
          visibilityGraphInput.restrictedAreas,
          visibilityGraphInput.targets
        );
        const pathLine = await buildSearchGeojsonResult(visibilityGraph, distanceMaxM, isDijkstra);
        expect(pathLine).not.toBeNull();
        if (pathLine !== null) {
          featureCollection.features.push(pathLine);
          // uncomment to regenerate expected result
          // saveFeatureCollection(`test/visibilityGraph/${folderPath}/visibility-graph-optimal-path-expected.geojson`, featureCollection);
          const visibilityGraphResultExpected = loadFeatureCollection(
            `test/visibilityGraph/${folderPath}/visibility-graph-optimal-path-expected.geojson`
          );
          expect(featureCollection).toEqual(visibilityGraphResultExpected);
          const pathDistance = turf.length(pathLine, { units: 'meters' });
          expect(pathDistance).toBeLessThanOrEqual(distanceMaxM);
        }
      }
    );

    it.each([
      ['Simple graph short with only one target', 'simple', 10_000],
      ['Simple graph multi polygon', 'simple-multi-polygon', 10_000],
      ['Simple graph multi target', 'simple-multi-target', 10_000],
      ['Complex graph short with only one target', 'complex', 10_000],
    ])(
      'Calling search should return empty path if no path found in distanceMax - %s',
      async (description, folderPath, distanceMaxM: number) => {
        const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(
          `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
        );
        const visibilityGraph = new VisibilityGraph(
          visibilityGraphInput.start,
          visibilityGraphInput.restrictedAreas,
          visibilityGraphInput.targets
        );
        const pathLine = await buildSearchGeojsonResult(visibilityGraph, distanceMaxM, isDijkstra);
        expect(pathLine).toBeNull();
      }
    );
  });

  it.each([
    ['Simple', 'small', 100_000],
    ['Medium', 'medium', 100_000],
    ['Large', 'large', 100_000],
    ['XLarge', 'xlarge', 200_000],
    ['XXLarge', 'xxlarge', 300_000],
  ])('VisibilityGraph profiling search test - %s', async (description: string, folderPath: string, distanceMaxM: number) => {
    const { visibilityGraphInput, featureCollection } = readVisibilityGraphInputFromGeoJson(
      `test/profiling/${folderPath}/visibility-graph-input.geojson`
    );
    const visibilityGraph = new VisibilityGraph(
      visibilityGraphInput.start,
      visibilityGraphInput.restrictedAreas,
      visibilityGraphInput.targets
    );
    const pathLine = await buildSearchGeojsonResult(visibilityGraph, distanceMaxM, false);
    expect(pathLine).not.toBeNull();
    if (pathLine !== null) {
      featureCollection.features.push(pathLine);
      // uncomment to regenerate expected result
      // saveFeatureCollection(`test/profiling/${folderPath}/visibility-graph-optimal-path-expected.geojson`, featureCollection);
      const visibilityGraphResultExpected = loadFeatureCollection(
        `test/profiling/${folderPath}/visibility-graph-optimal-path-expected.geojson`
      );
      expect(featureCollection).toEqual(visibilityGraphResultExpected);
      const pathDistance = turf.length(pathLine, { units: 'meters' });
      expect(pathDistance).toBeLessThanOrEqual(distanceMaxM);
    }
  });
});
