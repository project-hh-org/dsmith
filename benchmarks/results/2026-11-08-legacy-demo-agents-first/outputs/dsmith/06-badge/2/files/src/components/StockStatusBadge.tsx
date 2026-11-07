import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

const config: Record<StockStatus, { label: string; tone: string }> = {
  sufficient: {
    label: "충분",
    tone: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    tone: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  },
  soldOut: {
    label: "품절",
    tone: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
  },
};

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, tone } = config[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)]text-[length:var(--text-xs)]",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
