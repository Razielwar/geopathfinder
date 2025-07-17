import { expect, describe, it } from '@jest/globals';

import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, LineString } from 'geojson';
import { loadFeatureCollection } from '../test/geojsonUtils';
import { VisibilityGraph } from './VisibilityGraph';

type VisibilityGraphInput = {
  start: Feature<Point>;
  restrictedAreas: Feature<Polygon | MultiPolygon>[];
  targets: Feature<Point>[];
};

type ReadVisibilityGraphResult = { visibilityGraphInput: VisibilityGraphInput; featureCollection: FeatureCollection };

function isStartPoint(feature: Feature): feature is Feature<Point> {
  return feature.properties?.['type'] === 'StartPoint' && feature.geometry.type === 'Point';
}

function isLandingPoint(feature: Feature): feature is Feature<Point> {
  return feature.properties?.['type'] === 'LandingPoint' && feature.geometry.type === 'Point';
}

function readVisibilityGraphInputFromGeoJson(geojsonFilePath: string): ReadVisibilityGraphResult {
  const featureCollection = loadFeatureCollection(geojsonFilePath);

  const start = featureCollection.features.find(isStartPoint);
  if (start === undefined) {
    throw new Error(`no start point found in the file ${geojsonFilePath}`);
  }

  const restrictedAreas = featureCollection.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon> => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'
  );
  const targets = featureCollection.features.filter(isLandingPoint);

  return {
    visibilityGraphInput: { start, restrictedAreas, targets },
    featureCollection,
  };
}

function buildFeatureCollectionFromVisibilityGraphData(visibilityGraph: VisibilityGraph): FeatureCollection {
  // @ts-ignore
  const start = turf.point(visibilityGraph.startPoint.toCoords());
  start.properties = {
    type: 'StartPoint',
    'marker-color': '#041295',
  };

  // @ts-ignore
  const { points } = visibilityGraph;
  const pointFeatures = points.map((nodePoint) => {
    const point = turf.point(nodePoint.toCoords());
    let color = 'deepskyblue';
    if (nodePoint.isConcave) {
      color = 'firebrick';
    } else if (nodePoint.isTarget) {
      color = 'green';
    }

    point.properties = {
      isConcave: nodePoint.isConcave,
      isTarget: nodePoint.isTarget,
      'marker-color': color,
      ...point.properties,
    };
    return point;
  });

  // @ts-ignore
  const { edges } = visibilityGraph;
  const edgeFeatures = edges.map((edge) => {
    const line = turf.lineString([edge.p1.toCoords(), edge.p2.toCoords()]);
    line.properties = {
      stroke: 'royalblue',
      'stroke-width': 3,
    };
    return line;
  });

  const features: Feature[] = [...pointFeatures, ...edgeFeatures];

  return turf.featureCollection(features);
}

function buildFeatureCollectionFromProcessingVisibilityLines(
  visibilityGraph: VisibilityGraph,
  featureCollectionInput: FeatureCollection
): FeatureCollection {
  // @ts-ignore
  const { points } = visibilityGraph;
  const visibilityLineFeatures: Feature<LineString>[] = [];

  const visited = [];
  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i]!;
    if (!currentPoint.isConcave) {
      visited[currentPoint.id] = true;
      // @ts-ignore
      visibilityGraph.processPointChildren(currentPoint.id, visited).forEach((toPoint) => {
        const line = turf.lineString([currentPoint.toCoords(), toPoint.toCoords()]);
        line.properties = {
          type: 'VisibilityLine',
          stroke: 'mediumblue',
          'stroke-width': 3,
        };
        visibilityLineFeatures.push(line);
      });
    }
  }

  return turf.featureCollection([...featureCollectionInput.features, ...visibilityLineFeatures]);
}

async function buildSearchGeojsonResult(
  visibilityGraph: VisibilityGraph,
  distanceMax: number,
  isDisjkstra: boolean
): Promise<Feature<LineString> | null> {
  const path = isDisjkstra ? await visibilityGraph.searchDijkstra(distanceMax) : await visibilityGraph.searchAStar(distanceMax);

  if (path.length >= 2) {
    const line = turf.lineString(path);
    line.properties = {
      type: 'Contingency',
      stroke: 'deeppink',
    };

    return line;
  }
  return null;
}

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
      ['Simple graph short with only one target', 'simple', 100],
      ['Simple graph multi polygon', 'simple-multi-polygon', 100],
      ['Simple graph multi target', 'simple-multi-target', 100],
      ['Complex graph short with only one target', 'complex', 100],
    ])(
      'Calling search should return optimal path to target - %s',
      async (description: string, folderPath: string, distanceMaxKm: number) => {
        const { visibilityGraphInput, featureCollection } = readVisibilityGraphInputFromGeoJson(
          `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
        );
        const visibilityGraph = new VisibilityGraph(
          visibilityGraphInput.start,
          visibilityGraphInput.restrictedAreas,
          visibilityGraphInput.targets
        );
        const pathLine = await buildSearchGeojsonResult(visibilityGraph, distanceMaxKm, isDijkstra);
        expect(pathLine).not.toBeNull();
        if (pathLine !== null) {
          featureCollection.features.push(pathLine);
          // uncomment to regenerate expected result
          // saveFeatureCollection(`test/visibilityGraph/${folderPath}/visibility-graph-optimal-path-expected.geojson`, featureCollection);
          const visibilityGraphResultExpected = loadFeatureCollection(
            `test/visibilityGraph/${folderPath}/visibility-graph-optimal-path-expected.geojson`
          );
          expect(featureCollection).toEqual(visibilityGraphResultExpected);
          const pathDistance = turf.length(pathLine, { units: 'kilometers' });
          expect(pathDistance).toBeLessThanOrEqual(distanceMaxKm);
        }
      }
    );

    it.each([
      ['Simple graph short with only one target', 'simple', 10],
      ['Simple graph multi polygon', 'simple-multi-polygon', 10],
      ['Simple graph multi target', 'simple-multi-target', 10],
      ['Complex graph short with only one target', 'complex', 10],
    ])(
      'Calling search should return empty path if no path found in distanceMax - %s',
      async (description, folderPath, distanceMaxKm: number) => {
        const { visibilityGraphInput } = readVisibilityGraphInputFromGeoJson(
          `test/visibilityGraph/${folderPath}/visibility-graph-input.geojson`
        );
        const visibilityGraph = new VisibilityGraph(
          visibilityGraphInput.start,
          visibilityGraphInput.restrictedAreas,
          visibilityGraphInput.targets
        );
        const pathLine = await buildSearchGeojsonResult(visibilityGraph, distanceMaxKm, isDijkstra);
        expect(pathLine).toBeNull();
      }
    );
  });
});
