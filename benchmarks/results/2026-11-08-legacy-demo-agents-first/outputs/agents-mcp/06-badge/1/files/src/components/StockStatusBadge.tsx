import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; className: string }> = {
  enough: {
    label: "충분",
    className: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    className:
      "bg-[var(--color-gray-50)] text-[var(--color-red-500)] border border-[var(--color-red-500)]",
  },
  soldOut: {
    label: "품절",
    className: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  },
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, className: tone } = config[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)] text-[length:var(--text-xs)] font-medium",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
