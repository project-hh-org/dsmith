interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 디자인 토큰(design-system/tokens.css)의 CSS 변수만 사용한다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="border bg-white border-[var(--color-gray-100)] rounded-[var(--radius-sm)] p-[var(--space-4)] min-w-[240px]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <p className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-blue-900)]">{name}</p>
        {/* Badge는 골격(구현 전)이라 쓰지 않고 토큰으로 직접 구성 */}
        <span className="bg-[var(--color-gray-50)] text-[color:var(--color-blue-400)] text-[length:var(--text-xs)] rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-2)]">
          {grade}
        </span>
      </div>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">{email}</p>
      <p className="mt-[var(--space-4)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        누적 주문{" "}
        <span className="text-[color:var(--color-blue-900)] font-bold">{orderCount.toLocaleString()}건</span>
      </p>
    </div>
  );
}
