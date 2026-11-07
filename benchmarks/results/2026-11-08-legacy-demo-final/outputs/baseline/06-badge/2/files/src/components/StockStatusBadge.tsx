import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldout";

interface StockStatusBadgeProps {
  status: StockStatus;
}

const LABEL: Record<StockStatus, string> = {
  sufficient: "충분",
  low: "부족",
  soldout: "품절",
};

// 모양은 src/components/Badge.tsx 와 동일(rounded-full, text-xs), 색은 Tailwind 기본 팔레트 사용
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        status === "sufficient" && "bg-green-100 text-green-800",
        status === "low" && "bg-amber-100 text-amber-800",
        status === "soldout" && "bg-red-100 text-red-800",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
