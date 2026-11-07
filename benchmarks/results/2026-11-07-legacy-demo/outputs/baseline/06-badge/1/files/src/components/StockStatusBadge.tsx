import clsx from "clsx";

export type StockStatus = "in-stock" | "low" | "out";

interface StockStatusBadgeProps {
  status: StockStatus;
}

const LABEL: Record<StockStatus, string> = {
  "in-stock": "충분",
  low: "부족",
  out: "품절",
};

// 재고 상태 뱃지. 모양은 Badge(rounded-full, text-xs)와 맞추고 색만 상태별로 다름
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        status === "in-stock" && "bg-green-100 text-green-700",
        status === "low" && "bg-amber-100 text-amber-700",
        status === "out" && "bg-red-100 text-red-700",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
