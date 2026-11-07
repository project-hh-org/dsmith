import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 (예: "VIP", "Gold") */
  grade: string;
  className?: string;
}

// 값은 design-system/tokens.css 의 CSS 변수만 사용한다.
const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
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
  fontWeight: 600,
  color: "var(--color-blue-900)",
};

const mutedStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const gradeStyle: CSSProperties = {
  display: "inline-block",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  fontSize: "var(--text-xs)",
};

const statsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  paddingTop: "var(--space-3)",
  borderTop: "1px solid var(--color-gray-100)",
};

const orderValueStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--color-blue-900)",
};

export function CustomerSummaryCard({ name, email, orderCount, grade, className }: CustomerSummaryCardProps) {
  return (
    <section className={className} style={cardStyle} aria-label={`${name} 고객 요약`}>
      <div style={headerStyle}>
        <h3 style={nameStyle}>{name}</h3>
        <span style={gradeStyle}>{grade}</span>
      </div>
      <p style={mutedStyle}>{email}</p>
      <div style={statsStyle}>
        <p style={mutedStyle}>누적 주문 수</p>
        <p style={orderValueStyle}>{orderCount.toLocaleString("ko-KR")}건</p>
      </div>
    </section>
  );
}
