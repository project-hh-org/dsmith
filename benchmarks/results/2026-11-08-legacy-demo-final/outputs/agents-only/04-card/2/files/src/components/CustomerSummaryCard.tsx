import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  totalOrders: number;
  grade: string;
  className?: string;
}

// 디자인 토큰(design-system/tokens.css)의 CSS 변수만 사용한다.
const styles: Record<string, CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
    padding: "var(--space-4)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-blue-900)",
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
  },
  grade: {
    padding: "0 var(--space-2)",
    borderRadius: "var(--radius-full)",
    background: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
  },
  email: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  orders: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "var(--space-3)",
    borderTop: "1px solid var(--color-gray-100)",
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  ordersValue: {
    color: "var(--color-blue-900)",
    fontWeight: 600,
  },
};

export function CustomerSummaryCard({
  name,
  email,
  totalOrders,
  grade,
  className,
}: CustomerSummaryCardProps) {
  return (
    <section style={styles.card} className={className}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span style={styles.grade}>{grade}</span>
      </div>
      <p style={styles.email}>{email}</p>
      <div style={styles.orders}>
        <span>누적 주문 수</span>
        <span style={styles.ordersValue}>{totalOrders.toLocaleString("ko-KR")}건</span>
      </div>
    </section>
  );
}
