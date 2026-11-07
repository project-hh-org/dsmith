import { Badge, type OrderStatus } from "@/components/common/StatusBadge";
import { formatWon } from "@/lib/format";

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

// 최근 주문 목록. 주문번호·고객명·금액·상태를 한 줄씩 보여주고 항목 사이에 구분선을 둔다
export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p className="p-4 text-center text-gray-500">{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 text-sm">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-4 px-4 py-3">
          <span className="w-24 font-medium text-gray-900">{order.id}</span>
          <span className="flex-1 text-gray-700">{order.customer}</span>
          <span className="text-right text-gray-900">{formatWon(order.amount)}</span>
          <Badge status={order.status} />
        </li>
      ))}
    </ul>
  );
}
