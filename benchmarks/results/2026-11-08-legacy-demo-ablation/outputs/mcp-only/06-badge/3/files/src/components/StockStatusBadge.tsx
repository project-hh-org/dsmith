import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

const LABEL: Record<StockStatus, string> = {
  enough: "충분",
  low: "부족",
  soldOut: "품절",
};

// 재고 상태 뱃지. 레포의 Badge와 같은 pill 모양을 따르고,
// 토큰이 있는 색(red, gray)은 design-system/tokens.css 변수를 사용함
export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        status === "enough" && "bg-green-100 text-green-800",
        status === "low" && "bg-amber-100 text-amber-800",
        status === "soldOut" && "bg-[var(--color-red-500)] text-white",
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
