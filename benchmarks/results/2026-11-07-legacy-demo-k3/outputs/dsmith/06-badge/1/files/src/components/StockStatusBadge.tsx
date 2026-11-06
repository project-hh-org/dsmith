import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; badge: string; dot: string }> = {
  enough: {
    label: "충분",
    badge: "bg-[var(--color-gray-50)] text-[var(--color-blue-900)]",
    dot: "bg-[var(--color-blue-400)]",
  },
  low: {
    label: "부족",
    badge: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
    dot: "bg-[var(--color-gray-500)]",
  },
  soldOut: {
    label: "품절",
    badge: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
    dot: "bg-[var(--color-gray-50)]",
  },
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, badge, dot } = config[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] font-medium",
        badge,
        className,
      )}
    >
      <span aria-hidden="true" className={clsx("h-[var(--space-2)] w-[var(--space-2)] rounded-[var(--radius-full)]", dot)} />
      {label}
    </span>
  );
}
