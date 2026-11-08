type Stock = "enough" | "low" | "out";

const LABEL: Record<Stock, string> = { enough: "충분", low: "부족", out: "품절" };

const STYLE: Record<Stock, string> = {
  enough: "bg-[color:var(--ds-color-gray-50)] text-[color:var(--ds-color-gray-900)]",
  low: "bg-[color:var(--ds-color-gray-100)] text-[color:var(--ds-color-gray-900)]",
  out: "bg-[color:var(--ds-color-red-500)] text-[color:var(--ds-color-gray-50)]",
};

export function StockStatusBadge({ stock }: { stock: Stock }) {
  return (
    <span className={`inline-flex items-center rounded-[var(--ds-radius-full)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] ${STYLE[stock]}`}>
      {LABEL[stock]}
    </span>
  );
}
