import clsx from "clsx";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본 10. */
  lowStockThreshold?: number;
  emptyText?: string;
}

export function InventoryTable({ items, lowStockThreshold = 10, emptyText = "재고 데이터가 없습니다." }: InventoryTableProps) {
  if (items.length === 0) {
    return <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">{emptyText}</p>;
  }

  const th = "px-[var(--space-4)] py-[var(--space-2)] font-medium text-[color:var(--color-blue-900)]";
  const td = "px-[var(--space-4)] py-[var(--space-3)]";

  return (
    <table className="w-full border border-[color:var(--color-gray-100)] text-[length:var(--text-xs)]">
      <thead className="bg-[color:var(--color-gray-50)]">
        <tr>
          <th className={clsx(th, "text-left")}>상품명</th>
          <th className={clsx(th, "text-left")}>SKU</th>
          <th className={clsx(th, "text-right")}>재고 수량</th>
          <th className={clsx(th, "text-left")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              className={clsx(
                "border-t border-[color:var(--color-gray-100)]",
                low && "bg-[color:var(--color-gray-50)] shadow-[inset_4px_0_0_var(--color-red-500)]",
              )}
            >
              <td className={clsx(td, low && "font-medium")}>{item.name}</td>
              <td className={clsx(td, "text-[color:var(--color-gray-500)]")}>{item.sku}</td>
              <td className={clsx(td, "text-right", low && "font-medium text-[color:var(--color-red-500)]")}>
                {item.quantity.toLocaleString()}
              </td>
              <td className={td}>
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[2px]",
                    low
                      ? "border border-[color:var(--color-red-500)] text-[color:var(--color-red-500)]"
                      : "border border-[color:var(--color-gray-100)] text-[color:var(--color-gray-500)]",
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
