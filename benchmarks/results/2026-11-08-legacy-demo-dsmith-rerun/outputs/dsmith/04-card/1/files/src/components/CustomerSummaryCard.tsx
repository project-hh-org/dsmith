import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
// Badge는 골격(구현 전)이라 쓰지 않고, 등급 표시는 토큰 스타일의 span으로 만든다.
const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-2)",
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "var(--color-blue-900)",
};

const gradeStyle: CSSProperties = {
  padding: "0 var(--space-2)",
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-50)",
  background: "var(--color-blue-400)",
  borderRadius: "var(--radius-full)",
};

const muted: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const stats: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--space-2)",
  margin: 0,
};

const statValue: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "var(--color-blue-900)",
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <section style={card} aria-label={`${name} 고객 요약`}>
      <div style={header}>
        <h3 style={nameStyle}>{name}</h3>
        <span style={gradeStyle}>{grade}</span>
      </div>
      <p style={muted}>{email}</p>
      <dl style={stats}>
        <dt style={muted}>누적 주문</dt>
        <dd style={statValue}>{orderCount.toLocaleString("ko-KR")}건</dd>
      </dl>
    </section>
  );
}
