// Geo utilities: parse GeoJSON/KML boundaries and auto-generate grid cells.

export type LatLng = [number, number]; // [lat, lng]

export interface ParsedBoundary {
  coords: LatLng[]; // outer ring, closed or open
  centerLat: number;
  centerLng: number;
}

export function pointInPolygon(pt: LatLng, poly: LatLng[]): boolean {
  let inside = false;
  const [y, x] = pt;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function bbox(coords: LatLng[]) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

export interface GeneratedCell {
  row: number;
  col: number;
  code: string;
  lat: number; // center
  lng: number;
  polygon: LatLng[]; // 4-corner square
}

export function generateGridCells(
  coords: LatLng[],
  cellSizeDeg: number,
  slug: string
): GeneratedCell[] {
  const { minLat, maxLat, minLng, maxLng } = bbox(coords);
  const cells: GeneratedCell[] = [];
  const rows = Math.ceil((maxLat - minLat) / cellSizeDeg);
  const cols = Math.ceil((maxLng - minLng) / cellSizeDeg);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = minLat + (r + 0.5) * cellSizeDeg;
      const lng = minLng + (c + 0.5) * cellSizeDeg;
      if (!pointInPolygon([lat, lng], coords)) continue;
      const h = cellSizeDeg / 2;
      cells.push({
        row: r,
        col: c,
        code: `${slug.toUpperCase()}-R${r}C${c}`,
        lat,
        lng,
        polygon: [
          [lat - h, lng - h],
          [lat - h, lng + h],
          [lat + h, lng + h],
          [lat + h, lng - h],
          [lat - h, lng - h],
        ],
      });
    }
  }
  return cells;
}

export function cellPolygonFromCenter(lat: number, lng: number, cellSizeDeg: number): LatLng[] {
  const h = cellSizeDeg / 2;
  return [
    [lat - h, lng - h],
    [lat - h, lng + h],
    [lat + h, lng + h],
    [lat + h, lng - h],
    [lat - h, lng - h],
  ];
}

/**
 * Parse a GeoJSON string. Accepts FeatureCollection, Feature, or bare Polygon geometry.
 * Returns first outer ring converted to [lat,lng] pairs.
 */
export function parseGeoJSON(text: string): ParsedBoundary {
  const json = JSON.parse(text);
  const geom = findFirstPolygon(json);
  if (!geom) throw new Error("No Polygon geometry found in GeoJSON");
  // GeoJSON is [lng,lat]; flip.
  const outer = (geom.coordinates?.[0] ?? []) as Array<[number, number]>;
  const coords: LatLng[] = outer.map(([lng, lat]) => [lat, lng]);
  return finalize(coords);
}

function findFirstPolygon(node: unknown): { coordinates: unknown[] } | null {
  if (!node || typeof node !== "object") return null;
  const anyNode = node as Record<string, unknown>;
  if (anyNode.type === "Polygon") return anyNode as { coordinates: unknown[] };
  if (anyNode.type === "MultiPolygon") {
    const coords = anyNode.coordinates as unknown[];
    return { coordinates: (coords[0] ?? []) as unknown[] };
  }
  if (anyNode.type === "Feature") return findFirstPolygon(anyNode.geometry);
  if (anyNode.type === "FeatureCollection") {
    for (const f of (anyNode.features as unknown[]) ?? []) {
      const g = findFirstPolygon(f);
      if (g) return g;
    }
  }
  return null;
}

/**
 * Parse a KML string. Reads first <Polygon>/<outerBoundaryIs>/<coordinates>.
 */
export function parseKML(text: string): ParsedBoundary {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error("Invalid KML");
  const coordsEl = doc.querySelector("Polygon outerBoundaryIs LinearRing coordinates")
    ?? doc.querySelector("coordinates");
  if (!coordsEl?.textContent) throw new Error("No <coordinates> found in KML");
  const coords: LatLng[] = coordsEl.textContent
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [lng, lat] = tok.split(",").map(Number);
      return [lat, lng] as LatLng;
    })
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  if (coords.length < 3) throw new Error("KML polygon has fewer than 3 points");
  return finalize(coords);
}

function finalize(coords: LatLng[]): ParsedBoundary {
  const b = bbox(coords);
  return {
    coords,
    centerLat: (b.minLat + b.maxLat) / 2,
    centerLng: (b.minLng + b.maxLng) / 2,
  };
}

export function parseBoundaryFile(name: string, text: string): ParsedBoundary {
  const lower = name.toLowerCase();
  if (lower.endsWith(".kml")) return parseKML(text);
  return parseGeoJSON(text);
}