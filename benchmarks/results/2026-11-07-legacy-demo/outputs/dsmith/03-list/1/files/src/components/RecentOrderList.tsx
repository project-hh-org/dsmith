import clsx from "clsx";

export type OrderStatus = "paid" | "pending" | "cancelled";

export interface RecentOrder {
  id: string;
  orderNo: string;
  customer: string;
  amount: number;
  status: OrderStatus;
}

export interface RecentOrderListProps {
  orders: RecentOrder[];
  className?: string;
}

const statusLabel: Record<OrderStatus, string> = {
  paid: "결제완료",
  pending: "대기",
  cancelled: "취소",
};

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수를 사용한다.
const statusStyle: Record<OrderStatus, string> = {
  paid: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  pending: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  cancelled: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
};

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, className }: RecentOrderListProps) {
  return (
    <ul
      className={clsx(
        "m-0 list-none p-0",
        "divide-y divide-[var(--color-gray-100)]",
        "border border-[var(--color-gray-100)] rounded-[var(--radius-sm)]",
        "bg-[var(--color-gray-50)] text-[length:var(--text-xs)]",
        className,
      )}
    >
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)]"
        >
          <span className="w-28 shrink-0 text-[var(--color-gray-500)]">{order.orderNo}</span>
          <span className="min-w-0 flex-1 truncate text-[var(--color-blue-900)]">{order.customer}</span>
          <span className="text-right text-[var(--color-blue-900)]">{won.format(order.amount)}원</span>
          <span
            className={clsx(
              "shrink-0 rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)]",
              statusStyle[order.status],
            )}
          >
            {statusLabel[order.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
