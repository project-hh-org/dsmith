import clsx from "clsx";
import { Badge } from "./Badge";

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

const HEADERS = [
  { key: "name", label: "상품명", align: "left" },
  { key: "sku", label: "SKU", align: "left" },
  { key: "quantity", label: "재고 수량", align: "right" },
  { key: "status", label: "상태", align: "left" },
] as const;

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return <p className="p-4 text-center text-gray-500">{emptyText ?? "재고 데이터가 없습니다."}</p>;
  }

  return (
    <table className="w-full text-sm bg-white border border-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {HEADERS.map((h) => (
            <th
              key={h.key}
              className={clsx("px-4 py-2 font-medium text-gray-700", h.align === "right" ? "text-right" : "text-left")}
            >
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              className={clsx("border-t border-gray-200", isLow && "bg-red-50")}
              data-low-stock={isLow || undefined}
            >
              <td className="px-4 py-3">{item.name}</td>
              <td className="px-4 py-3 text-gray-500">{item.sku}</td>
              <td className={clsx("px-4 py-3 text-right", isLow && "font-semibold text-red-600")}>
                {item.quantity.toLocaleString("ko-KR")}
              </td>
              <td className="px-4 py-3">
                <Badge color={isLow ? "red" : "gray"}>{item.status}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
