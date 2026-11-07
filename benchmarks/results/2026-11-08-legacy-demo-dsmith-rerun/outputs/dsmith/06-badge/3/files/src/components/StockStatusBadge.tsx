import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; className: string }> = {
  sufficient: {
    label: "충분",
    className: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    className: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  },
  soldOut: {
    label: "품절",
    className: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
  },
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  /** 기본 라벨(충분·부족·품절) 대신 보여 줄 텍스트 */
  label?: string;
  className?: string;
}

export function StockStatusBadge({ status, label, className }: StockStatusBadgeProps) {
  const { label: defaultLabel, className: tone } = config[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)] text-[length:var(--text-xs)] font-medium",
        tone,
        className,
      )}
    >
      {label ?? defaultLabel}
    </span>
  );
}
