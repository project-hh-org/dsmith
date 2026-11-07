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

const amountFormatter = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none bg-white p-0">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-[var(--space-4)] border-t border-[var(--color-gray-100)] px-[var(--space-4)] py-[var(--space-3)] first:border-t-0"
        >
          <span className="w-32 shrink-0 text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.orderNumber}
          </span>
          <span className="min-w-0 flex-1 truncate text-[length:var(--text-xs)] text-[var(--color-blue-900)]">
            {order.customerName}
          </span>
          <span className="shrink-0 text-right text-[length:var(--text-xs)] font-medium text-[var(--color-blue-900)]">
            {amountFormatter.format(order.amount)}원
          </span>
          <span className="w-16 shrink-0 text-right text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
