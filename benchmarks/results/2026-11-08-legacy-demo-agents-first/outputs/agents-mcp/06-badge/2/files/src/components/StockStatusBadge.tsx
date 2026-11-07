import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; className: string }> = {
  sufficient: { label: "충분", className: "bg-ds-blue-400 text-ds-gray-50" },
  low: { label: "부족", className: "bg-ds-gray-100 text-ds-blue-900" },
  soldOut: { label: "품절", className: "bg-ds-red-500 text-ds-gray-50" },
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
        "inline-block rounded-ds-full px-ds-3 py-[2px] text-ds-xs font-medium",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
