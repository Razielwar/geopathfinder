import type { FeatureCollection } from 'geojson';
import type { MapManager } from '../map/mapManager';

export interface Scenario {
  id: string;
  label: string;
  file: string;
}

/** Fetch the scenarios index and return the typed list */
export async function fetchScenarioList(): Promise<Scenario[]> {
  const response = await fetch('scenarios/index.json');
  if (!response.ok) {
    throw new Error(`Failed to load scenarios index: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Scenario[];
}

/** Fetch a GeoJSON scenario file and load it onto the map */
export async function loadScenario(file: string, mapManager: MapManager): Promise<void> {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Failed to load scenario "${file}": ${response.status} ${response.statusText}`);
  }
  const collection = (await response.json()) as FeatureCollection;
  mapManager.loadScenario(collection);
}
