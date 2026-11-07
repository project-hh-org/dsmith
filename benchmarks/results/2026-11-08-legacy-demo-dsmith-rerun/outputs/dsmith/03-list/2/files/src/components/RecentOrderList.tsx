import clsx from "clsx";

export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: string;
  tone?: "default" | "positive" | "danger";
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

// 디자인 토큰(ds-*)만 사용한다. 항목 사이는 divide로 구분선을 둔다.
export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p className="p-ds-4 text-center text-ds-xs text-ds-gray-500">{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul className="divide-y divide-ds-gray-100 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between gap-ds-4 px-ds-4 py-ds-3">
          <span className="text-ds-xs text-ds-gray-500">{order.orderNo}</span>
          <span className="flex-1 truncate text-ds-xs text-ds-blue-900">{order.customerName}</span>
          <span className="text-ds-xs text-ds-blue-900">{order.amount.toLocaleString("ko-KR")}원</span>
          <span
            className={clsx(
              "text-ds-xs",
              order.tone === "positive" && "text-ds-blue-400",
              order.tone === "danger" && "text-ds-red-500",
              (order.tone ?? "default") === "default" && "text-ds-gray-500",
            )}
          >
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
