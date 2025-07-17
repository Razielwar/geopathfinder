import type { FeatureCollection } from 'geojson';
import * as fs from 'fs';

export function loadFeatureCollection(geojsonFilePath: string): FeatureCollection {
  // Read the contents of the file into a string
  const geojsonString = fs.readFileSync(geojsonFilePath, 'utf8');

  // Parse the string into a GeoJSON object
  return JSON.parse(geojsonString) as FeatureCollection;
}

export function saveFeatureCollection(geojsonFilePath: string, featureCollection: FeatureCollection) {
  fs.writeFileSync(geojsonFilePath, JSON.stringify(featureCollection, null, 2));
}
