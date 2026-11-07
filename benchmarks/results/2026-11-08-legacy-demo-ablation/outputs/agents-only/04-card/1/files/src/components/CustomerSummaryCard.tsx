interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 고객 요약 카드. 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수만 사용.
// Badge는 골격(구현 전)이라 쓰지 않고 등급 칩을 직접 그린다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div
      style={{
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-blue-900)" }}>
          {name}
        </p>
        <span
          style={{
            background: "var(--color-blue-400)",
            color: "var(--color-gray-50)",
            borderRadius: "var(--radius-full)",
            padding: "0 var(--space-2)",
            fontSize: "var(--text-xs)",
          }}
        >
          {grade}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>{email}</p>
      <dl style={{ margin: 0, display: "flex", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
        <dt style={{ color: "var(--color-gray-500)" }}>누적 주문</dt>
        <dd style={{ margin: 0, color: "var(--color-blue-900)", fontWeight: 700 }}>{orderCount.toLocaleString("ko-KR")}건</dd>
      </dl>
    </div>
  );
}
