import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
}

const LABEL: Record<StockStatus, string> = {
  enough: "충분",
  low: "부족",
  soldOut: "품절",
};

// 색상은 design-system/tokens.css 변수를 사용 (하드코딩 값 없음)
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full border px-2 py-[3px] text-xs",
        status === "enough" &&
          "border-transparent bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
        status === "low" &&
          "border-[var(--color-red-500)] bg-[var(--color-gray-50)] text-[var(--color-red-500)]",
        status === "soldOut" &&
          "border-transparent bg-[var(--color-red-500)] text-white",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
