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
    return <p className="p-ds-4 text-center text-ds-gray-500">{emptyText ?? "재고 데이터가 없습니다."}</p>;
  }

  return (
    <table className="w-full border border-ds-gray-100 text-ds-xs">
      <thead className="bg-ds-gray-50">
        <tr>
          <th className="px-ds-4 py-ds-2 text-left font-medium text-ds-gray-500">상품명</th>
          <th className="px-ds-4 py-ds-2 text-left font-medium text-ds-gray-500">SKU</th>
          <th className="px-ds-4 py-ds-2 text-right font-medium text-ds-gray-500">재고 수량</th>
          <th className="px-ds-4 py-ds-2 text-left font-medium text-ds-gray-500">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < LOW_STOCK_THRESHOLD;
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              className={clsx(
                "border-t border-ds-gray-100",
                low ? "bg-ds-gray-50 font-medium text-ds-red-500" : "text-ds-blue-900",
              )}
            >
              <td className="px-ds-4 py-ds-3">{item.name}</td>
              <td className="px-ds-4 py-ds-3">{item.sku}</td>
              <td className="px-ds-4 py-ds-3 text-right">{item.quantity}</td>
              <td className="px-ds-4 py-ds-3">{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
