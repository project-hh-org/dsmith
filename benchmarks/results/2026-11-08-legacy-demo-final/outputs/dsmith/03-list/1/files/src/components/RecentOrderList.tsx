export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  className?: string;
}

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, className }: RecentOrderListProps) {
  return (
    <ul className={className}>
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between border-b border-[var(--color-gray-100)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-xs)] last:border-b-0"
        >
          <span className="text-[var(--color-gray-500)]">{order.orderNumber}</span>
          <span className="flex-1 px-[var(--space-4)] text-[var(--color-blue-900)]">
            {order.customerName}
          </span>
          <span className="px-[var(--space-4)] text-[var(--color-blue-900)]">
            {won.format(order.amount)}원
          </span>
          <span className="text-[var(--color-gray-500)]">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
