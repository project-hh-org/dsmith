import clsx from "clsx";

export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: "결제완료" | "배송중" | "배송완료" | "취소";
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 변수만 사용
const statusStyle: Record<RecentOrder["status"], string> = {
  결제완료: "text-[color:var(--color-blue-400)]",
  배송중: "text-[color:var(--color-blue-400)]",
  배송완료: "text-[color:var(--color-gray-500)]",
  취소: "text-[color:var(--color-red-500)]",
};

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--color-gray-100)] rounded-[var(--radius-sm)] border border-[color:var(--color-gray-100)]">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)]"
        >
          <span className="w-32 shrink-0 text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
            {order.orderNo}
          </span>
          <span className="min-w-0 flex-1 truncate text-[color:var(--color-blue-900)]">
            {order.customerName}
          </span>
          <span className="text-right font-medium text-[color:var(--color-blue-900)]">
            {order.amount.toLocaleString("ko-KR")}원
          </span>
          <span
            className={clsx(
              "w-16 shrink-0 text-right text-[length:var(--text-xs)] font-medium",
              statusStyle[order.status],
            )}
          >
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
