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
  emptyText?: string;
}

/** 이 수량 미만이면 행을 강조한다. */
export const LOW_STOCK_THRESHOLD = 10;

export function InventoryTable({ items, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  const thClass =
    "px-[var(--space-4)] py-[var(--space-2)] font-medium text-[color:var(--color-blue-900)]";

  return (
    <table className="w-full border border-[color:var(--color-gray-100)] bg-white text-[length:var(--text-xs)]">
      <thead className="bg-[color:var(--color-gray-50)]">
        <tr>
          <th className={clsx(thClass, "text-left")}>상품명</th>
          <th className={clsx(thClass, "text-left")}>SKU</th>
          <th className={clsx(thClass, "text-right")}>재고 수량</th>
          <th className={clsx(thClass, "text-left")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < LOW_STOCK_THRESHOLD;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx(
                "border-t border-[color:var(--color-gray-100)]",
                isLow && "bg-[color:var(--color-gray-50)] shadow-[inset_4px_0_0_var(--color-red-500)]",
              )}
            >
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--color-blue-900)]">
                {item.name}
              </td>
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--color-gray-500)]">
                {item.sku}
              </td>
              <td
                className={clsx(
                  "px-[var(--space-4)] py-[var(--space-3)] text-right",
                  isLow
                    ? "font-medium text-[color:var(--color-red-500)]"
                    : "text-[color:var(--color-blue-900)]",
                )}
              >
                {item.quantity}
              </td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[2px]",
                    isLow
                      ? "bg-[color:var(--color-red-500)] text-white"
                      : "bg-[color:var(--color-gray-100)] text-[color:var(--color-blue-900)]",
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
