import { formatWon } from "../lib/format";

export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none p-0">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center gap-[var(--space-4)] border-b border-[color:var(--color-gray-100)] py-[var(--space-3)] last:border-b-0"
        >
          <span className="w-32 shrink-0 text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
            {order.orderNo}
          </span>
          <span className="min-w-0 flex-1 truncate text-[color:var(--color-blue-900)]">
            {order.customerName}
          </span>
          <span className="text-right font-medium text-[color:var(--color-blue-900)]">
            {formatWon(order.amount)}
          </span>
          <span className="w-20 shrink-0 text-right text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
