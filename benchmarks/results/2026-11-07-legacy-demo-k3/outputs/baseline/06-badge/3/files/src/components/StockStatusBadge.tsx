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

// 재고 상태 뱃지 (충분·부족·품절). Badge와 같은 pill 모양을 Tailwind 클래스만으로 구성
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
