import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson';
import { loadFeatureCollection, saveFeatureCollection } from './geojsonUtils';
import { VisibilityGraph } from '../src/VisibilityGraph';

export interface VisibilityGraphInput {
  start: Feature<Point>;
  restrictedAreas: Feature<Polygon | MultiPolygon>[];
  targets: Feature<Point>[];
}

export interface ReadVisibilityGraphResult {
  visibilityGraphInput: VisibilityGraphInput;
  featureCollection: FeatureCollection;
}

function isStartPoint(feature: Feature): feature is Feature<Point> {
  return feature.properties?.['type'] === 'StartPoint' && feature.geometry.type === 'Point';
}

function isLandingPoint(feature: Feature): feature is Feature<Point> {
  return feature.properties?.['type'] === 'LandingPoint' && feature.geometry.type === 'Point';
}

export function readVisibilityGraphInputFromGeoJson(geojsonFilePath: string): ReadVisibilityGraphResult {
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

export function buildFeatureCollectionFromVisibilityGraphData(visibilityGraph: VisibilityGraph): FeatureCollection {
  // @ts-expect-error we need to access private members
  const start = turf.point(visibilityGraph._startPoint.toCoords());
  start.properties = {
    type: 'StartPoint',
    'marker-color': '#041295',
  };

  // @ts-expect-error we need to access private members
  const points = visibilityGraph._points;
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

  // @ts-expect-error we need to access private members
  const edges = visibilityGraph._edges;
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

export async function buildSearchGeojsonResult(
  visibilityGraph: VisibilityGraph,
  distanceMax: number,
  isDijkstra: boolean
): Promise<Feature<LineString> | null> {
  const path = isDijkstra ? await visibilityGraph.searchDijkstra(distanceMax) : await visibilityGraph.searchAStar(distanceMax);

  if (path.length >= 2) {
    const line = turf.lineString(path);
    line.properties = {
      stroke: 'deeppink',
    };

    return line;
  }
  return null;
}

export function buildFeatureCollectionFromProcessingVisibilityLines(
  visibilityGraph: VisibilityGraph,
  featureCollectionInput: FeatureCollection
): FeatureCollection {
  // @ts-expect-error we need to access private members
  const points = visibilityGraph._points;
  const visibilityLineFeatures: Feature<LineString>[] = [];

  const visited = [];
  for (const currentPoint of points) {
    if (!currentPoint.isConcave) {
      visited[currentPoint.id] = true;
      // @ts-expect-error we need to access private members
      visibilityGraph._processPointChildren(currentPoint.id, visited).forEach((toPoint) => {
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

export function saveSearchResult(visibilityGraph: VisibilityGraph, featureCollection: FeatureCollection, folderPath: string): void {
  const visibilityGraphData = buildFeatureCollectionFromVisibilityGraphData(visibilityGraph);
  saveFeatureCollection(`test/profiling/${folderPath}/visibility-graph-data-expected.geojson`, visibilityGraphData);
}
