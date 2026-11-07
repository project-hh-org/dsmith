import clsx from "clsx";
import { Badge } from "./Badge";

export type InventoryStatus = "active" | "soldout" | "discontinued";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: InventoryStatus;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const STATUS_LABEL: Record<InventoryStatus, string> = {
  active: "판매중",
  soldout: "품절",
  discontinued: "단종",
};

const STATUS_COLOR: Record<InventoryStatus, "blue" | "gray" | "red"> = {
  active: "blue",
  soldout: "red",
  discontinued: "gray",
};

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-4 text-center text-[var(--color-gray-500)]">{emptyText ?? "재고 데이터가 없습니다."}</p>
    );
  }

  return (
    <table className="w-full text-sm bg-white border border-[var(--color-gray-100)]">
      <thead className="bg-[var(--color-gray-50)]">
        <tr>
          <th className="px-4 py-2 text-left font-medium text-gray-700">상품명</th>
          <th className="px-4 py-2 text-left font-medium text-gray-700">SKU</th>
          <th className="px-4 py-2 text-right font-medium text-gray-700">재고 수량</th>
          <th className="px-4 py-2 text-left font-medium text-gray-700">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx("border-t border-[var(--color-gray-100)]", isLow && "bg-red-50")}
            >
              <td className="px-4 py-[11px]">{item.name}</td>
              <td className="px-4 py-[11px] text-[var(--color-gray-500)]">{item.sku}</td>
              <td
                className={clsx(
                  "px-4 py-[11px] text-right tabular-nums",
                  isLow && "font-semibold text-[var(--color-red-500)]",
                )}
              >
                {item.quantity.toLocaleString("ko-KR")}
              </td>
              <td className="px-4 py-[11px]">
                <Badge color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status]}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
