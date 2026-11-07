import clsx from "clsx";

export const LOW_STOCK_THRESHOLD = 10;

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

const headerCell =
  "px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[color:var(--color-gray-500)]";
const bodyCell = "px-[var(--space-4)] py-[var(--space-3)]";

export function InventoryTable({ items, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table className="w-full border border-[color:var(--color-gray-100)] bg-white text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]">
      <thead className="bg-[color:var(--color-gray-50)]">
        <tr>
          <th scope="col" className={clsx(headerCell, "text-left")}>상품명</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>SKU</th>
          <th scope="col" className={clsx(headerCell, "text-right")}>재고 수량</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>상태</th>
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
                isLow && "bg-[color:color-mix(in_srgb,var(--color-red-500)_10%,white)]",
              )}
            >
              <td className={clsx(bodyCell, isLow && "font-medium")}>{item.name}</td>
              <td className={clsx(bodyCell, "text-[color:var(--color-gray-500)]")}>{item.sku}</td>
              <td
                className={clsx(
                  bodyCell,
                  "text-right tabular-nums",
                  isLow && "font-medium text-[color:var(--color-red-500)]",
                )}
              >
                {item.quantity.toLocaleString("ko-KR")}
              </td>
              <td className={clsx(bodyCell, isLow && "text-[color:var(--color-red-500)]")}>
                {item.status}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
