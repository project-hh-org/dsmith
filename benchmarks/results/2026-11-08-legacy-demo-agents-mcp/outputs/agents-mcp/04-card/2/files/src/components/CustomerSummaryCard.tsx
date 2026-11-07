import clsx from "clsx";

export type MembershipGrade = "bronze" | "silver" | "gold" | "vip";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: MembershipGrade;
  className?: string;
}

const gradeLabels: Record<MembershipGrade, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  vip: "VIP",
};

// 디자인 시스템 토큰(design-system/tokens.css)의 CSS 변수만 사용한다.
// Badge 컴포넌트는 골격 상태라 쓰지 않고, 토큰으로 등급 표시를 직접 구성한다.
const gradeStyles: Record<MembershipGrade, string> = {
  bronze: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  silver: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  gold: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  vip: "bg-[var(--color-blue-900)] text-[var(--color-gray-50)]",
};

export function CustomerSummaryCard({
  name,
  email,
  orderCount,
  grade,
  className,
}: CustomerSummaryCardProps) {
  return (
    <div
      className={clsx(
        "border border-[var(--color-gray-100)] bg-[var(--color-gray-50)]",
        "rounded-[var(--radius-sm)] p-[var(--space-4)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0">
          <p className="truncate text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">
            {name}
          </p>
          <p className="mt-[var(--space-2)] truncate text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
            {email}
          </p>
        </div>
        <span
          className={clsx(
            "inline-block shrink-0 rounded-[var(--radius-full)]",
            "px-[var(--space-2)] py-[var(--space-2)] leading-none",
            "text-[length:var(--text-xs)] font-medium",
            gradeStyles[grade],
          )}
        >
          {gradeLabels[grade]}
        </span>
      </div>

      <dl className="mt-[var(--space-4)] flex items-baseline justify-between border-t border-[var(--color-gray-100)] pt-[var(--space-3)]">
        <dt className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">누적 주문 수</dt>
        <dd className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">
          {orderCount.toLocaleString("ko-KR")}건
        </dd>
      </dl>
    </div>
  );
}
