import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
}

const LABEL: Record<StockStatus, string> = {
  sufficient: "충분",
  low: "부족",
  soldOut: "품절",
};

// 토큰이 있는 색(gray, red)은 design-system/tokens.css 변수를 쓰고,
// 토큰이 없는 초록·주황은 Tailwind 기본 팔레트를 씀.
// (tailwind.config에 ds preset이 아직 없어서 ds-* 클래스 대신 var()를 직접 참조)
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[3px] text-[length:var(--text-xs)]",
        status === "sufficient" && "bg-green-100 text-green-800",
        status === "low" && "bg-amber-100 text-amber-800",
        status === "soldOut" && "bg-[var(--color-red-500)] text-white",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
