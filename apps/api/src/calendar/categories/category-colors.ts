export const CALENDAR_CATEGORY_COLORS = [
  "#2563EB", // reunion interne
  "#16A34A", // client / ecole
  "#7C3AED", // deploiement
  "#EA580C", // commercial
  "#DC2626", // important / direction
  "#CA8A04", // administratif
  "#0891B2", // formation
  "#374151", // personnel
] as const;

export type CalendarCategoryColor = (typeof CALENDAR_CATEGORY_COLORS)[number];
