import type { MapManager } from '../map/mapManager';
import { fetchScenarioList, loadScenario } from '../scenarios/loader';
import type { Scenario } from '../scenarios/loader';

export interface ControlRefs {
  searchButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  loadScenarioButton: HTMLButtonElement;
  scenarioSelect: HTMLSelectElement;
  distanceMaxInput: HTMLInputElement;
  algorithmSelect: HTMLSelectElement;
  loadingIndicator: HTMLElement;
  resultPanel: HTMLElement;
}

/** Build the control panel DOM and wire up all handlers except Search (returned via refs) */
export async function initControls(container: HTMLElement, resultPanel: HTMLElement, mapManager: MapManager): Promise<ControlRefs> {
  // ── Scenario row ────────────────────────────────────────────────────────────
  const scenarioLabel = document.createElement('label');
  scenarioLabel.textContent = 'Scenario';

  const scenarioSelect = document.createElement('select');
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Custom';
  scenarioSelect.appendChild(customOption);

  const loadScenarioButton = document.createElement('button');
  loadScenarioButton.type = 'button';
  loadScenarioButton.className = 'btn-secondary';
  loadScenarioButton.textContent = 'Load Scenario';

  // ── distanceMax row ─────────────────────────────────────────────────────────
  const distanceLabel = document.createElement('label');
  distanceLabel.textContent = 'Max distance (m)';

  const distanceMaxInput = document.createElement('input');
  distanceMaxInput.type = 'number';
  distanceMaxInput.min = '1';
  distanceMaxInput.value = '5000000';

  // ── Algorithm row ───────────────────────────────────────────────────────────
  const algorithmLabel = document.createElement('label');
  algorithmLabel.textContent = 'Algorithm';

  const algorithmSelect = document.createElement('select');
  const astarOption = document.createElement('option');
  astarOption.value = 'a*';
  astarOption.textContent = 'A*';
  const dijkstraOption = document.createElement('option');
  dijkstraOption.value = 'dijkstra';
  dijkstraOption.textContent = 'Dijkstra';
  algorithmSelect.appendChild(astarOption);
  algorithmSelect.appendChild(dijkstraOption);

  // ── Action buttons ──────────────────────────────────────────────────────────
  const sep = document.createElement('hr');
  sep.className = 'separator';

  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.className = 'btn-primary';
  searchButton.textContent = 'Search';

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'btn-secondary';
  clearButton.textContent = 'Clear';

  // ── Loading indicator ───────────────────────────────────────────────────────
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading';
  loadingIndicator.textContent = 'Computing…';

  // ── Mobile notice ───────────────────────────────────────────────────────────
  const mobileNotice = document.createElement('p');
  mobileNotice.className = 'mobile-notice';
  mobileNotice.textContent = 'Drawing tools are not available on mobile. Please load a predefined scenario below.';

  // ── Assemble container ──────────────────────────────────────────────────────
  container.appendChild(mobileNotice);
  container.appendChild(scenarioLabel);
  container.appendChild(scenarioSelect);
  container.appendChild(loadScenarioButton);
  container.appendChild(distanceLabel);
  container.appendChild(distanceMaxInput);
  container.appendChild(algorithmLabel);
  container.appendChild(algorithmSelect);
  container.appendChild(sep);
  container.appendChild(searchButton);
  container.appendChild(clearButton);
  container.appendChild(loadingIndicator);

  // ── Load scenario list asynchronously ───────────────────────────────────────
  try {
    const scenarios = await fetchScenarioList();
    populateScenarioDropdown(scenarioSelect, scenarios);
  } catch (err) {
    console.error('Could not load scenario list:', err);
  }

  // ── Modified-state tracking ─────────────────────────────────────────────────
  mapManager.onMapEdited = () => {
    if (scenarioSelect.value !== 'custom') {
      const selected = scenarioSelect.options[scenarioSelect.selectedIndex];
      if (selected && !selected.textContent?.endsWith(' (modified)')) {
        selected.textContent = `${selected.textContent} (modified)`;
      }
    }
  };

  // ── Load Scenario button ────────────────────────────────────────────────────
  loadScenarioButton.addEventListener('click', async () => {
    if (scenarioSelect.value === 'custom') {
      mapManager.clearAll();
      showResult(resultPanel, '', 'hidden');
    } else {
      try {
        await loadScenario(scenarioSelect.value, mapManager);
        // Reset the label to the base scenario name (remove "(modified)" suffix)
        const selected = scenarioSelect.options[scenarioSelect.selectedIndex];
        if (selected) {
          const label = selected.textContent?.replace(' (modified)', '') ?? selected.textContent ?? '';
          selected.textContent = label;
        }
      } catch (err) {
        showResult(resultPanel, `Error loading scenario: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    }
  });

  // ── Clear button ─────────────────────────────────────────────────────────────
  clearButton.addEventListener('click', () => {
    mapManager.clearAll();
    showResult(resultPanel, '', 'hidden');
    // Reset dropdown to Custom
    scenarioSelect.value = 'custom';
    // Reset all option labels (remove "(modified)" if present)
    Array.from(scenarioSelect.options).forEach((opt) => {
      opt.textContent = opt.textContent?.replace(' (modified)', '') ?? opt.textContent;
    });
  });

  return {
    searchButton,
    clearButton,
    loadScenarioButton,
    scenarioSelect,
    distanceMaxInput,
    algorithmSelect,
    loadingIndicator,
    resultPanel,
  };
}

function populateScenarioDropdown(select: HTMLSelectElement, scenarios: Scenario[]): void {
  scenarios.forEach((s) => {
    const option = document.createElement('option');
    option.value = s.file;
    option.textContent = s.label;
    select.appendChild(option);
  });
}

type ResultType = 'success' | 'error' | 'info' | 'hidden';

export function showResult(panel: HTMLElement, message: string, type: ResultType): void {
  if (type === 'hidden' || message === '') {
    panel.className = '';
    panel.style.display = 'none';
    panel.textContent = '';
    return;
  }
  panel.className = `visible ${type}`;
  panel.style.display = '';
  panel.textContent = message;
}
