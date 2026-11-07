import { Badge } from "./Badge";

export type StockStatus = "sufficient" | "low" | "soldout";

const LABEL: Record<StockStatus, string> = {
  sufficient: "충분",
  low: "부족",
  soldout: "품절",
};

const COLOR: Record<StockStatus, "blue" | "gray" | "red"> = {
  sufficient: "blue",
  low: "gray",
  soldout: "red",
};

interface StockStatusBadgeProps {
  status: StockStatus;
}

// 재고 상태 배지. 공용 Badge(src/components/Badge)를 그대로 재사용한다.
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return <Badge color={COLOR[status]}>{LABEL[status]}</Badge>;
}
