import type { CSSProperties } from "react";

export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
}

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  background: "var(--color-gray-50)",
  borderRadius: "var(--radius-sm)",
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

export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul style={listStyle}>
      {orders.map((order, index) => (
        <li key={order.id} style={{ ...rowStyle, ...(index > 0 ? dividerStyle : null) }}>
          <span style={mutedStyle}>{order.id}</span>
          <span>{order.customerName}</span>
          <span>{order.amount.toLocaleString("ko-KR")}원</span>
          <span style={mutedStyle}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
