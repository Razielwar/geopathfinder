import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

// ── Layer-tag constants ────────────────────────────────────────────────────────

const TAG_START = 'start';
const TAG_TARGET = 'target';
const TAG_OBSTACLE = 'obstacle';

type LayerTag = typeof TAG_START | typeof TAG_TARGET | typeof TAG_OBSTACLE;

// Extend Leaflet Layer to carry our custom tag
interface TaggedLayer extends L.Layer {
  _demoTag?: LayerTag;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const startIcon = makeIcon('#2563eb'); // blue
const targetIcon = makeIcon('#16a34a'); // green

// ── MapManager ────────────────────────────────────────────────────────────────

export class MapManager {
  private _map: L.Map;
  private _startPoint: Feature<Point> | null = null;
  private _targets: Feature<Point>[] = [];
  private _obstacles: Feature<Polygon>[] = [];
  private _resultPolyline: L.Polyline | null = null;

  /** Called whenever the user draws or deletes a feature */
  public onMapEdited: (() => void) | null = null;

  public constructor(containerId: string) {
    this._map = L.map(containerId, { zoomControl: true }).setView([48, 10], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this._map);

    this._initGeoman();
  }

  // ── GeoMan setup ────────────────────────────────────────────────────────────

  private _initGeoman(): void {
    this._map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    // pm:create fires on the map whenever a new shape is finished
    this._map.on('pm:create', (e) => {
      const layer = e.layer as TaggedLayer;
      const shape = e.shape;

      if (shape === 'Marker') {
        // Alternate between start and target based on current state
        if (this._startPoint === null) {
          this._placeStart(layer as L.Marker);
        } else {
          this._placeTarget(layer as L.Marker);
        }
      } else if (shape === 'Polygon') {
        this._placeObstacle(layer as L.Polygon);
      }

      this.onMapEdited?.();
    });

    // pm:remove fires when a layer is deleted via Removal Mode
    this._map.on('pm:remove', (e) => {
      const layer = e.layer as TaggedLayer;
      this._removeLayerFromState(layer);
      this.onMapEdited?.();
    });
  }

  // ── State helpers ────────────────────────────────────────────────────────────

  private _placeStart(marker: L.Marker): void {
    // Remove any existing start marker from the map
    this._map.eachLayer((l) => {
      const tl = l as TaggedLayer;
      if (tl._demoTag === TAG_START) {
        this._map.removeLayer(l);
      }
    });

    const latlng = marker.getLatLng();
    this._startPoint = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat] },
      properties: {},
    };

    const tagged = marker as TaggedLayer;
    tagged._demoTag = TAG_START;
    marker.setIcon(startIcon);
  }

  private _placeTarget(marker: L.Marker): void {
    const latlng = marker.getLatLng();
    const feature: Feature<Point> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat] },
      properties: {},
    };
    this._targets.push(feature);

    const tagged = marker as TaggedLayer;
    tagged._demoTag = TAG_TARGET;
    marker.setIcon(targetIcon);
  }

  private _placeObstacle(polygon: L.Polygon): void {
    const latlngs = polygon.getLatLngs() as L.LatLng[][];
    const ring = (latlngs[0] ?? []).map((ll) => [ll.lng, ll.lat] as [number, number]);
    // Close the ring
    if (ring.length > 0 && ring[0] !== undefined) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (last === undefined || first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }

    const feature: Feature<Polygon> = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {},
    };
    this._obstacles.push(feature);

    const tagged = polygon as TaggedLayer;
    tagged._demoTag = TAG_OBSTACLE;
    polygon.setStyle({ color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.4 });
  }

  private _removeLayerFromState(layer: TaggedLayer): void {
    const tag = layer._demoTag;
    if (tag === TAG_START) {
      this._startPoint = null;
    } else if (tag === TAG_TARGET) {
      // Match by coordinates
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        this._targets = this._targets.filter((f) => f.geometry.coordinates[0] !== latlng.lng || f.geometry.coordinates[1] !== latlng.lat);
      }
    } else if (tag === TAG_OBSTACLE) {
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs() as L.LatLng[][];
        const first = latlngs[0]?.[0];
        if (first !== undefined) {
          this._obstacles = this._obstacles.filter(
            (f) => f.geometry.coordinates[0]?.[0]?.[0] !== first.lng || f.geometry.coordinates[0]?.[0]?.[1] !== first.lat
          );
        }
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  public get startPoint(): Feature<Point> | null {
    return this._startPoint;
  }

  public get targets(): Feature<Point>[] {
    return this._targets;
  }

  public get obstacles(): Feature<Polygon>[] {
    return this._obstacles;
  }

  /** Remove all drawn features and reset state */
  public clearAll(): void {
    // Remove all tagged layers
    const toRemove: L.Layer[] = [];
    this._map.eachLayer((l) => {
      if ((l as TaggedLayer)._demoTag !== undefined) {
        toRemove.push(l);
      }
    });
    toRemove.forEach((l) => this._map.removeLayer(l));

    // Remove result path
    if (this._resultPolyline !== null) {
      this._map.removeLayer(this._resultPolyline);
      this._resultPolyline = null;
    }

    this._startPoint = null;
    this._targets = [];
    this._obstacles = [];
  }

  /** Load a FeatureCollection onto the map, clearing existing state first */
  public loadScenario(collection: FeatureCollection): void {
    this.clearAll();

    const allLatLngs: L.LatLng[] = [];

    collection.features.forEach((feature) => {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const latlng = L.latLng(lat, lng);
        const pointFeature = feature as Feature<Point>;
        const propType = pointFeature.properties?.['type'] as string | undefined;

        if (propType === 'StartPoint') {
          const marker = L.marker(latlng, { icon: startIcon }).addTo(this._map);
          (marker as TaggedLayer)._demoTag = TAG_START;
          this._startPoint = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {},
          };
        } else {
          // LandingPoint or any other marker → target
          const marker = L.marker(latlng, { icon: targetIcon }).addTo(this._map);
          (marker as TaggedLayer)._demoTag = TAG_TARGET;
          this._targets.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {},
          });
        }

        allLatLngs.push(latlng);
      } else if (feature.geometry.type === 'Polygon') {
        const polygonFeature = feature as Feature<Polygon>;
        const latlngs = polygonFeature.geometry.coordinates[0]?.map(([lng, lat]) => L.latLng(lat as number, lng as number)) ?? [];

        const polygon = L.polygon(latlngs, {
          color: '#6b7280',
          fillColor: '#9ca3af',
          fillOpacity: 0.4,
        }).addTo(this._map);
        (polygon as TaggedLayer)._demoTag = TAG_OBSTACLE;

        const ring = polygonFeature.geometry.coordinates[0]?.map(([lng, lat]) => [lng, lat] as [number, number]) ?? [];
        this._obstacles.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: {},
        });

        allLatLngs.push(...latlngs);
      }
    });

    // Auto-zoom to fit all loaded features
    if (allLatLngs.length > 0) {
      this._map.flyToBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] });
    }
  }

  /** Draw the result path on the map, replacing any previous result */
  public drawResultPath(coordinates: [number, number][]): void {
    if (this._resultPolyline !== null) {
      this._map.removeLayer(this._resultPolyline);
      this._resultPolyline = null;
    }

    const latlngs = coordinates.map(([lng, lat]) => L.latLng(lat, lng));
    this._resultPolyline = L.polyline(latlngs, {
      color: '#2563eb',
      weight: 3,
      opacity: 0.9,
    }).addTo(this._map);
  }

  /** Remove the result path from the map */
  public clearResultPath(): void {
    if (this._resultPolyline !== null) {
      this._map.removeLayer(this._resultPolyline);
      this._resultPolyline = null;
    }
  }
}
