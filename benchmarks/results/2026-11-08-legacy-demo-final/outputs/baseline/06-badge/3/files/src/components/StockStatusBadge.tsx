import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldout";

interface StockStatusBadgeProps {
  status: StockStatus;
}

const LABEL: Record<StockStatus, string> = {
  enough: "충분",
  low: "부족",
  soldout: "품절",
};

// 색은 design-system/tokens.css 변수를 사용한다. (tailwind.preset이 아직 config에 연결되지 않아 var()로 직접 참조)
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        status === "enough" &&
          "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
        status === "low" && "bg-[var(--color-blue-400)] text-white",
        status === "soldout" && "bg-[var(--color-red-500)] text-white",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
