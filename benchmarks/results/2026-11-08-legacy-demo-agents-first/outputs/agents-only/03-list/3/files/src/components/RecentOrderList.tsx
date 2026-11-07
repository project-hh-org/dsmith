import clsx from "clsx";

export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  className?: string;
}

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" });

// 색·간격·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
// Badge는 골격(구현 전)이라 상태는 텍스트로 표시한다.
export function RecentOrderList({ orders, className }: RecentOrderListProps) {
  return (
    <ul
      className={clsx(
        "m-0 list-none p-0",
        "rounded-[var(--radius-sm)] bg-[var(--color-gray-50)]",
        className,
      )}
    >
      {orders.map((order) => (
        <li
          key={order.id}
          className={clsx(
            "flex items-center justify-between gap-[var(--space-4)]",
            "px-[var(--space-4)] py-[var(--space-3)]",
            "border-b border-[var(--color-gray-100)] last:border-b-0",
          )}
        >
          <span className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.id}
          </span>
          <span className="flex-1 text-[length:var(--text-xs)] text-[var(--color-blue-900)]">
            {order.customerName}
          </span>
          <span className="text-[length:var(--text-xs)] text-[var(--color-blue-900)]">
            {won.format(order.amount)}
          </span>
          <span className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
