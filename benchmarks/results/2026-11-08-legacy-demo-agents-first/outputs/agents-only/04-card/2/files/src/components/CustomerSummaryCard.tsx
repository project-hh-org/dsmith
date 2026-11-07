interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 값은 design-system/tokens.css 의 CSS 변수만 사용 (하드코딩 금지)
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div
      style={{
        minWidth: 240,
        padding: "var(--space-4)",
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--color-blue-900)",
          }}
        >
          {name}
        </p>
        <span
          style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-full)",
            background: "var(--color-blue-400)",
            color: "var(--color-gray-50)",
            fontSize: "var(--text-xs)",
          }}
        >
          {grade}
        </span>
      </div>
      <p
        style={{
          margin: "var(--space-2) 0 0",
          fontSize: "var(--text-xs)",
          color: "var(--color-gray-500)",
        }}
      >
        {email}
      </p>
      <p
        style={{
          margin: "var(--space-3) 0 0",
          fontSize: "var(--text-xs)",
          color: "var(--color-gray-500)",
        }}
      >
        누적 주문{" "}
        <strong style={{ color: "var(--color-blue-900)" }}>{orderCount.toLocaleString("ko-KR")}건</strong>
      </p>
    </div>
  );
}
