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
  /** 이 수량 미만이면 행을 강조합니다. 기본 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수를 사용합니다.
export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-ds-4 text-center text-[length:var(--text-xs)] text-ds-gray-500">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  const headerCell = "px-ds-4 py-ds-2 font-medium text-ds-blue-900";

  return (
    <table className="w-full border border-ds-gray-100 bg-ds-gray-50 text-[length:var(--text-xs)] text-ds-blue-900">
      <thead>
        <tr>
          <th className={clsx(headerCell, "text-left")}>상품명</th>
          <th className={clsx(headerCell, "text-left")}>SKU</th>
          <th className={clsx(headerCell, "text-right")}>재고 수량</th>
          <th className={clsx(headerCell, "text-left")}>상태</th>
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
                "border-t border-ds-gray-100",
                isLow && "border-l-4 border-l-ds-red-500 bg-white font-medium text-ds-red-500",
              )}
            >
              <td className="px-ds-4 py-ds-3">{item.name}</td>
              <td className={clsx("px-ds-4 py-ds-3", !isLow && "text-ds-gray-500")}>{item.sku}</td>
              <td className="px-ds-4 py-ds-3 text-right tabular-nums">{item.quantity}</td>
              <td className="px-ds-4 py-ds-3">{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
