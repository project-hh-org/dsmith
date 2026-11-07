import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
const styles: Record<string, CSSProperties> = {
  card: {
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    padding: "var(--space-4)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-2)",
  },
  name: {
    margin: 0,
    fontSize: "var(--text-xl)",
    fontWeight: 700,
    color: "var(--color-blue-900)",
  },
  grade: {
    background: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
    borderRadius: "var(--radius-full)",
    padding: "0 var(--space-2)",
    fontSize: "var(--text-xs)",
  },
  email: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  orders: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  ordersValue: {
    color: "var(--color-blue-900)",
    fontWeight: 700,
  },
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span style={styles.grade}>{grade}</span>
      </div>
      <p style={styles.email}>{email}</p>
      <p style={styles.orders}>
        누적 주문 <span style={styles.ordersValue}>{orderCount.toLocaleString()}</span>건
      </p>
    </div>
  );
}
