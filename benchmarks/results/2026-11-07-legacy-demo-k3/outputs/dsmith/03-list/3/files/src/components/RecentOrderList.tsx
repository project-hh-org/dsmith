export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

const formatAmount = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none p-0 bg-[var(--color-gray-50)] rounded-[var(--radius-sm)]">
      {orders.map((order, index) => (
        <li
          key={order.id}
          className={`flex items-center gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-xs)] ${
            index > 0 ? "border-t border-[var(--color-gray-100)]" : ""
          }`}
        >
          <span className="w-28 shrink-0 text-[var(--color-gray-500)]">{order.orderNumber}</span>
          <span className="flex-1 truncate text-[var(--color-blue-900)]">{order.customerName}</span>
          <span className="shrink-0 text-right font-medium text-[var(--color-blue-900)]">
            {formatAmount(order.amount)}
          </span>
          <span className="w-16 shrink-0 text-right text-[var(--color-gray-500)]">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
