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

const won = new Intl.NumberFormat("ko-KR");

// 최근 주문 목록: 주문번호·고객명·금액·상태를 한 줄씩, 항목 사이에 구분선
export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none p-0 bg-white rounded-[var(--radius-sm)] border border-[var(--color-gray-100)]">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] border-t border-[var(--color-gray-100)] first:border-t-0"
        >
          <span className="w-32 shrink-0 text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.orderNo}
          </span>
          <span className="flex-1 truncate text-[var(--color-blue-900)]">{order.customerName}</span>
          <span className="text-right font-medium text-[var(--color-blue-900)]">
            {won.format(order.amount)}원
          </span>
          <span className="w-20 shrink-0 text-right text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
