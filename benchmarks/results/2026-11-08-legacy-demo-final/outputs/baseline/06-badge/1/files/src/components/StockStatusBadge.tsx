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

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        status === "enough" && "bg-green-100 text-green-700",
        status === "low" && "bg-amber-100 text-amber-700",
        status === "soldout" && "bg-red-100 text-red-700",
      )}
    >
      {LABEL[status]}
    </span>
  );
}
