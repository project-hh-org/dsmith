import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 (예: "VIP", "Gold") */
  grade: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-5)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-3)",
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "var(--color-blue-900)",
};

// Badge 컴포넌트는 골격 상태라 쓰지 않고 토큰으로 직접 구성한다.
const gradeStyle: CSSProperties = {
  display: "inline-block",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
};

const mutedStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const valueStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  paddingTop: "var(--space-3)",
  borderTop: "1px solid var(--color-gray-100)",
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <section style={card} aria-label={`${name} 고객 요약`}>
      <div style={header}>
        <h3 style={nameStyle}>{name}</h3>
        <span style={gradeStyle}>{grade}</span>
      </div>
      <p style={mutedStyle}>{email}</p>
      <div style={row}>
        <p style={mutedStyle}>누적 주문 수</p>
        <p style={valueStyle}>{orderCount.toLocaleString("ko-KR")}건</p>
      </div>
    </section>
  );
}
