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

// 최근 주문 목록. 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수를 사용한다.
export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center gap-[var(--space-4)] border-t border-[var(--color-gray-100)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-xs)] first:border-t-0"
        >
          <span className="w-32 shrink-0 font-medium text-[var(--color-blue-900)]">{order.orderNo}</span>
          <span className="min-w-0 flex-1 truncate text-[var(--color-blue-900)]">{order.customerName}</span>
          <span className="shrink-0 text-right text-[var(--color-blue-900)]">{won.format(order.amount)}원</span>
          <span className="w-20 shrink-0 text-right text-[var(--color-gray-500)]">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
