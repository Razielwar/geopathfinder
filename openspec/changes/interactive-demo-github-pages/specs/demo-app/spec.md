## ADDED Requirements

### Requirement: Map initialisation

The demo SHALL initialise a Leaflet map centred on a default viewport (Europe, zoom ~5) on page load. The map SHALL use OpenStreetMap tiles.

#### Scenario: Map loads on page open

- **WHEN** the user opens the demo URL
- **THEN** a full-viewport interactive Leaflet map is displayed with OSM tiles

#### Scenario: Map loads without console errors

- **WHEN** the demo page finishes loading
- **THEN** no JavaScript errors appear in the browser console

---

### Requirement: GeoMan drawing tools

The demo SHALL embed `@geoman-io/geoman-leaflet` and expose drawing controls for: a single start point (Marker), one or more target points (Marker), and one or more polygon obstacles (Polygon). Only one start point SHALL be permitted at a time; drawing a new start point removes the previous one. Any number of targets and polygons MAY be drawn.

#### Scenario: Draw start point

- **WHEN** the user activates the start-point tool and clicks on the map
- **THEN** a marker is placed at the clicked position and stored as the start point; any previous start point is removed

#### Scenario: Draw target point

- **WHEN** the user activates the target-point tool and clicks on the map
- **THEN** a marker is placed and appended to the list of target points

#### Scenario: Draw polygon obstacle

- **WHEN** the user draws a closed polygon using the polygon tool
- **THEN** the polygon is appended to the list of obstacles and rendered on the map

#### Scenario: Delete drawn feature

- **WHEN** the user uses GeoMan's delete/edit tools to remove a feature
- **THEN** the corresponding start point, target, or obstacle is removed from the internal state

---

### Requirement: Drawing tools hidden on mobile

On viewport widths ≤ 768 px the GeoMan drawing toolbar SHALL be hidden. A notice SHALL be displayed prompting the user to load a predefined scenario.

#### Scenario: Drawing toolbar hidden on small screen

- **WHEN** the demo is viewed on a viewport width ≤ 768 px
- **THEN** the GeoMan drawing toolbar is not visible

#### Scenario: Mobile notice displayed

- **WHEN** the demo is viewed on a viewport width ≤ 768 px
- **THEN** a text notice is displayed explaining that drawing is not available on mobile and directing the user to use predefined scenarios

---

### Requirement: Predefined scenario loader

The demo SHALL provide a scenario dropdown and a "Load Scenario" button. The dropdown SHALL list a permanent "Custom" entry (default, selected on startup) followed by the 5 predefined scenarios (Small, Medium, Large, XLarge, XXLarge). Selecting an entry in the dropdown SHALL NOT trigger any map change by itself. The map is only updated when the user clicks "Load Scenario".

When the user clicks "Load Scenario":

- If "Custom" is selected, the map is cleared (same behaviour as the Clear button).
- If a named scenario is selected, the current map state is cleared and the scenario geometry is loaded from the corresponding GeoJSON fixture.

The fixture format follows `test/profiling/*/visibility-graph-input.geojson`: features with `properties.type === 'StartPoint'` are start points, `properties.type === 'LandingPoint'` are targets, and Polygon features are obstacles.

After a named scenario is loaded, if the user draws or deletes any feature on the map, the dropdown label SHALL append " (modified)" to the currently loaded scenario name (e.g. "Small (modified)") to signal that the map state no longer matches the original scenario. This "(modified)" suffix is display-only and does not affect the value used when clicking "Load Scenario" again (which reloads the original scenario).

#### Scenario: Dropdown selection does not load immediately

- **WHEN** the user changes the dropdown selection
- **THEN** the map state is unchanged until the user clicks "Load Scenario"

#### Scenario: Load named scenario

- **WHEN** the user selects "Small" and clicks "Load Scenario"
- **THEN** the map clears all existing drawn features, then displays the scenario's start point, targets, and obstacles

#### Scenario: Load Custom clears map

- **WHEN** the user selects "Custom" and clicks "Load Scenario"
- **THEN** all drawn features are removed from the map and the result panel is cleared

#### Scenario: Scenario replaces previous state

- **WHEN** the user has previously drawn features and then loads a named scenario
- **THEN** all previously drawn features are removed before the scenario geometry is rendered

#### Scenario: All five scenarios are available

- **WHEN** the user opens the scenario dropdown
- **THEN** six options are listed: Custom, Small, Medium, Large, XLarge, XXLarge

#### Scenario: Modified state indicated after drawing

- **WHEN** the user loads "Medium" and then draws an additional polygon obstacle
- **THEN** the dropdown label changes to "Medium (modified)"

#### Scenario: Modified state cleared on reload

- **WHEN** the dropdown shows "Large (modified)" and the user clicks "Load Scenario"
- **THEN** the original Large scenario is reloaded and the dropdown label returns to "Large"

---

### Requirement: Search configuration controls

The demo SHALL provide:

- A numeric input for `distanceMax` in metres (default: 5 000 000; minimum: 1)
- A dropdown to select the pathfinding algorithm (`a*` or `dijkstra`; default: `a*`)
- A "Search" button that triggers the pathfinding computation

#### Scenario: Default values pre-filled

- **WHEN** the demo loads
- **THEN** the distanceMax input shows 5000000 and the algorithm dropdown shows "A\*"

#### Scenario: Invalid distanceMax rejected

- **WHEN** the user enters a value ≤ 0 in the distanceMax input and clicks Search
- **THEN** the search does not run and an error message is displayed

---

### Requirement: Search validation

Before running the search, the demo SHALL validate that at least one start point and at least one target point are present on the map. If either is missing, the search SHALL NOT run and a descriptive error message SHALL be shown.

#### Scenario: Missing start point

- **WHEN** the user clicks Search with no start point drawn
- **THEN** the search does not run and an error message states that a start point is required

#### Scenario: Missing target

- **WHEN** the user clicks Search with a start point but no targets
- **THEN** the search does not run and an error message states that at least one target is required

---

### Requirement: Search execution and loading state

Clicking the Search button SHALL instantiate `VisibilityGraph` from the `geopathfinder` npm package with the current start, targets, and obstacles, then call `graph.search(distanceMax, { shortestPathAlgorithm })`. While the search is running, the Search button SHALL be disabled and a loading indicator SHALL be displayed.

#### Scenario: Search in progress

- **WHEN** the user clicks Search and the computation is running
- **THEN** the Search button is disabled and a loading indicator is visible

#### Scenario: Search completes

- **WHEN** `graph.search(...)` resolves
- **THEN** the loading indicator is hidden and the Search button is re-enabled

---

### Requirement: Path visualisation

If the search returns a non-empty path, the demo SHALL render a polyline on the map connecting all waypoints in order. Any previously drawn result path SHALL be removed before drawing the new one.

#### Scenario: Path drawn on map

- **WHEN** `graph.search(...)` resolves with a path containing ≥ 2 points
- **THEN** a polyline connecting all returned coordinates is rendered on the map

#### Scenario: No path found

- **WHEN** `graph.search(...)` resolves with an empty array
- **THEN** no polyline is drawn and a message informs the user that no path was found within the given distanceMax

#### Scenario: Previous path cleared on new search

- **WHEN** the user runs a second search after a previous result is displayed
- **THEN** the previous path polyline is removed before the new result is rendered

---

### Requirement: Computation time display

After each completed search the demo SHALL display the elapsed time in milliseconds measured with `performance.now()` around the `await graph.search(...)` call.

#### Scenario: Time displayed after successful search

- **WHEN** the search completes with a non-empty path
- **THEN** the result panel shows the elapsed time in milliseconds (e.g. "Computed in 42 ms")

#### Scenario: Time displayed when no path found

- **WHEN** the search completes with an empty path
- **THEN** the result panel still shows the elapsed time

---

### Requirement: Search error handling

If `graph.search(...)` throws an error, the demo SHALL catch it, display a user-readable error message, and re-enable the Search button.

#### Scenario: Error during search

- **WHEN** `graph.search(...)` rejects or throws
- **THEN** the error message is displayed in the result panel, the loading indicator is hidden, and the Search button is re-enabled

---

### Requirement: Clear button

The demo SHALL provide a "Clear" button that removes all drawn features (start, targets, obstacles) and the result path from the map, clears the result panel, and resets the scenario dropdown to "Custom".

#### Scenario: Clear resets map

- **WHEN** the user clicks the Clear button
- **THEN** all start points, targets, obstacles, and result paths are removed from the map and the result panel is cleared

#### Scenario: Clear resets scenario dropdown

- **WHEN** the user clicks the Clear button after having loaded a named scenario
- **THEN** the scenario dropdown resets to "Custom"
