import { Badge } from "./Badge";

export type StockStatus = "sufficient" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; color: "blue" | "gray" | "red" }> = {
  sufficient: { label: "충분", color: "blue" },
  low: { label: "부족", color: "gray" },
  soldOut: { label: "품절", color: "red" },
};

interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const { label, color } = config[status];
  return <Badge color={color}>{label}</Badge>;
}
