import clsx from "clsx";
import { Badge } from "@/components/Badge";
import { Table, type Column } from "@/components/Table";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  status: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
}

export function InventoryTable({ items, lowStockThreshold = 10 }: InventoryTableProps) {
  const isLow = (item: InventoryItem) => item.stock < lowStockThreshold;

  // 공용 Table은 행 단위 스타일을 지원하지 않아, 셀 내부에서 강조합니다.
  const cell = (item: InventoryItem, content: React.ReactNode, extra?: string) => (
    <span className={clsx(isLow(item) && "font-semibold text-ds-red-500", extra)}>{content}</span>
  );

  const columns: Column<InventoryItem>[] = [
    { key: "name", header: "상품명", render: (item) => cell(item, item.name) },
    { key: "sku", header: "SKU", render: (item) => cell(item, item.sku) },
    {
      key: "stock",
      header: "재고 수량",
      align: "right",
      render: (item) => cell(item, item.stock.toLocaleString("ko-KR")),
    },
    {
      key: "status",
      header: "상태",
      render: (item) => (
        <span className="inline-flex items-center gap-2">
          <Badge color="gray">{item.status}</Badge>
          {isLow(item) && <Badge color="red">재고 부족</Badge>}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={items}
      rowKey={(item) => item.id}
      emptyText="재고 데이터가 없습니다."
    />
  );
}
