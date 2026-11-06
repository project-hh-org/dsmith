import type { CSSProperties } from "react";

// 디자인 토큰(design-system/tokens.css)의 CSS 변수만 사용한다.
const styles = {
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
  email: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  grade: {
    borderRadius: "var(--radius-full)",
    padding: "0 var(--space-2)",
    fontSize: "var(--text-xs)",
    background: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
  },
  orders: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: "var(--space-3)",
    borderTop: "1px solid var(--color-gray-100)",
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  ordersValue: {
    fontSize: "var(--text-xl)",
    fontWeight: 700,
    color: "var(--color-blue-900)",
  },
} satisfies Record<string, CSSProperties>;

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 (예: "VIP", "Gold") */
  grade: string;
  className?: string;
}

export function CustomerSummaryCard({ name, email, orderCount, grade, className }: CustomerSummaryCardProps) {
  return (
    <section className={className} style={styles.card} aria-label={`${name} 고객 요약`}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span style={styles.grade}>{grade}</span>
      </div>
      <p style={styles.email}>{email}</p>
      <div style={styles.orders}>
        <span>누적 주문 수</span>
        <span style={styles.ordersValue}>{orderCount.toLocaleString("ko-KR")}</span>
      </div>
    </section>
  );
}
