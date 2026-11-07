interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 값은 모두 design-system/tokens.css 의 CSS 변수를 사용한다 (하드코딩 없음)
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">{name}</p>
        <span className="px-[var(--space-2)] rounded-[var(--radius-full)] bg-[var(--color-blue-400)] text-[length:var(--text-xs)] text-[var(--color-gray-50)]">
          {grade}
        </span>
      </div>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{email}</p>
      <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        누적 주문 <span className="font-bold text-[var(--color-blue-900)]">{orderCount.toLocaleString()}</span>건
      </p>
    </div>
  );
}
