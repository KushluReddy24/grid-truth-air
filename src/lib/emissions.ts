export function emissionColor(value: number): string {
  // value in kg/day, returns HSL string
  if (value < 50) return "hsl(var(--emiq-low))";
  if (value < 100) return "hsl(var(--emiq-mid))";
  if (value < 200) return "hsl(var(--emiq-high))";
  return "hsl(var(--emiq-extreme))";
}

export function emissionLabel(value: number): string {
  if (value < 50) return "Low";
  if (value < 100) return "Moderate";
  if (value < 200) return "High";
  return "Severe";
}

export const SOURCE_LABELS: Record<string, string> = {
  industry: "Industry",
  transport: "Transport / Vehicles",
  domestic: "Domestic",
  road_dust: "Road Dust",
  other: "Other",
};

export const POLLUTANTS = ["PM2.5", "PM10", "NO2", "SO2", "CO"] as const;

export type Pollutant = (typeof POLLUTANTS)[number];
