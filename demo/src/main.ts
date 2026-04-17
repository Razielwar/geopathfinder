import './styles.css';
import { MapManager } from './map/mapManager';
import { initControls } from './ui/controls';
import { runSearch } from './search/runner';

async function main(): Promise<void> {
  const mapContainer = document.getElementById('map');
  const controlsContainer = document.getElementById('controls');
  const resultPanel = document.getElementById('result');

  if (mapContainer === null || controlsContainer === null || resultPanel === null) {
    throw new Error('Required DOM elements not found');
  }

  const mapManager = new MapManager('map');

  const refs = await initControls(controlsContainer, resultPanel, mapManager);

  refs.searchButton.addEventListener('click', () => {
    void runSearch(mapManager, refs);
  });
}

void main();
