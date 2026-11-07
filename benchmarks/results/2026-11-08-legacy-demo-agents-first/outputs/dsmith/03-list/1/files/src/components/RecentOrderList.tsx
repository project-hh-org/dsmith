import type { CSSProperties } from "react";

export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

export interface RecentOrderListProps {
  orders: RecentOrder[];
}

// 값은 모두 design-system/tokens.css 의 CSS 변수를 사용한다.
const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-3) var(--space-4)",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid var(--color-gray-100)",
};

const mutedStyle: CSSProperties = {
  color: "var(--color-gray-500)",
};

const formatAmount = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul style={listStyle}>
      {orders.map((order, index) => (
        <li key={order.id} style={{ ...rowStyle, ...(index > 0 ? dividerStyle : null) }}>
          <span style={mutedStyle}>{order.id}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span>{formatAmount(order.amount)}</span>
          <span style={mutedStyle}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
