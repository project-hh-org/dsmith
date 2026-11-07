import clsx from "clsx";

export type MembershipTier = "bronze" | "silver" | "gold" | "vip";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 */
  tier: MembershipTier;
  className?: string;
}

const tierLabels: Record<MembershipTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  vip: "VIP",
};

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
// Badge 컴포넌트는 골격(구현 전)이라 쓰지 않고 토큰으로 등급 표시를 직접 만든다.
const tierStyles: Record<MembershipTier, string> = {
  bronze: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  silver: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  gold: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  vip: "bg-[var(--color-blue-900)] text-[var(--color-gray-50)]",
};

export function CustomerSummaryCard({
  name,
  email,
  orderCount,
  tier,
  className,
}: CustomerSummaryCardProps) {
  return (
    <section
      className={clsx(
        "border border-[var(--color-gray-100)] bg-[var(--color-gray-50)]",
        "rounded-[var(--radius-sm)] p-[var(--space-4)]",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-[var(--space-3)]">
        <h3 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">
          {name}
        </h3>
        <span
          className={clsx(
            "rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-2)] leading-none",
            "text-[length:var(--text-xs)]",
            tierStyles[tier],
          )}
        >
          {tierLabels[tier]}
        </span>
      </header>

      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {email}
      </p>

      <dl className="mt-[var(--space-4)] flex items-baseline justify-between border-t border-[var(--color-gray-100)] pt-[var(--space-3)]">
        <dt className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">누적 주문</dt>
        <dd className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">
          {orderCount.toLocaleString("ko-KR")}건
        </dd>
      </dl>
    </section>
  );
}
