export const colors = {
  surface: "#ffffff",
  background: "#f4f4f5",
  text: "#18181b",
  muted: "#71717a",
  primary: "#2563eb",
  danger: "#dc2626",
  border: "#e4e4e7",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: "700" },
  body: { fontSize: 16, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "500" },
} as const;
