import type { CSSProperties } from "react";

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

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 변수만 사용한다.
const listStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
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

const mutedStyle: CSSProperties = { color: "var(--color-gray-500)" };

export function RecentOrderList({ orders, emptyText = "최근 주문이 없습니다." }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p style={{ ...mutedStyle, padding: "var(--space-4)", textAlign: "center", fontSize: "var(--text-xs)" }}>
        {emptyText}
      </p>
    );
  }

  return (
    <ul style={listStyle}>
      {orders.map((order, i) => (
        <li key={order.id} style={{ ...rowStyle, ...(i > 0 ? dividerStyle : null) }}>
          <span style={{ ...mutedStyle, minWidth: "var(--space-5)" }}>{order.orderNo}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span style={{ fontWeight: 600 }}>{order.amount.toLocaleString("ko-KR")}원</span>
          <span style={mutedStyle}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
