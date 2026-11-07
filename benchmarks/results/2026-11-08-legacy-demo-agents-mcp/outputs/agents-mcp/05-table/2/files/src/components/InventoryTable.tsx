import clsx from "clsx";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  const cell = "px-[var(--space-4)] py-[var(--space-3)]";
  const head = clsx(cell, "font-medium text-[var(--color-blue-900)]");

  return (
    <table className="w-full border border-[var(--color-gray-100)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]">
      <thead className="bg-[var(--color-gray-50)]">
        <tr>
          <th className={clsx(head, "text-left")}>상품명</th>
          <th className={clsx(head, "text-left")}>SKU</th>
          <th className={clsx(head, "text-right")}>재고 수량</th>
          <th className={clsx(head, "text-left")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx(
                "border-t border-[var(--color-gray-100)]",
                isLow && "bg-[color-mix(in_srgb,var(--color-red-500)_10%,transparent)]",
              )}
            >
              <td className={clsx(cell, isLow && "font-medium")}>{item.name}</td>
              <td className={clsx(cell, "text-[var(--color-gray-500)]")}>{item.sku}</td>
              <td
                className={clsx(
                  cell,
                  "text-right tabular-nums",
                  isLow && "font-medium text-[var(--color-red-500)]",
                )}
              >
                {item.quantity}
              </td>
              <td className={cell}>
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)]",
                    isLow
                      ? "bg-[var(--color-red-500)] text-[var(--color-gray-50)]"
                      : "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
                  )}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
