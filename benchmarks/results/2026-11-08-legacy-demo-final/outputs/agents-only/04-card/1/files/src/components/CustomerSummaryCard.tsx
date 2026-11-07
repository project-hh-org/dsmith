import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-5)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-blue-900)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-2)",
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 700,
};

const gradeStyle: CSSProperties = {
  padding: "0 var(--space-3)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-gray-50)",
  background: "var(--color-blue-400)",
  borderRadius: "var(--radius-full)",
};

const mutedStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const dlStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  margin: 0,
  paddingTop: "var(--space-3)",
  borderTop: "1px solid var(--color-gray-100)",
  fontSize: "var(--text-xs)",
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={nameStyle}>{name}</h3>
        <span style={gradeStyle}>{grade}</span>
      </div>
      <p style={mutedStyle}>{email}</p>
      <dl style={dlStyle}>
        <dt style={{ color: "var(--color-gray-500)" }}>누적 주문 수</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{orderCount.toLocaleString("ko-KR")}건</dd>
      </dl>
    </section>
  );
}
