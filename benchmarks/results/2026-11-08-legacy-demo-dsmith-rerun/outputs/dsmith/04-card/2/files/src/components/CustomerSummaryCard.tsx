import clsx from "clsx";

export type MembershipGrade = "bronze" | "silver" | "gold" | "vip";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
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

// 디자인 토큰(design-system/tailwind.preset.ts)만 사용한다.
// Badge는 골격(구현 전)이라 쓰지 않고 토큰 클래스로 등급 표시를 만든다.
const gradeStyles: Record<MembershipGrade, string> = {
  bronze: "bg-ds-gray-100 text-ds-blue-900",
  silver: "bg-ds-gray-50 text-ds-gray-500",
  gold: "bg-ds-blue-400 text-ds-gray-50",
  vip: "bg-ds-blue-900 text-ds-gray-50",
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
        "rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-ds-3">
        <div className="min-w-0">
          <p className="truncate text-ds-xl font-bold text-ds-blue-900">{name}</p>
          <p className="mt-ds-2 truncate text-ds-xs text-ds-gray-500">{email}</p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-ds-full px-ds-3 py-ds-2 text-ds-xs font-medium",
            gradeStyles[grade],
          )}
        >
          {gradeLabels[grade]}
        </span>
      </div>
      <dl className="mt-ds-4 flex items-baseline justify-between border-t border-ds-gray-100 pt-ds-3">
        <dt className="text-ds-xs text-ds-gray-500">누적 주문</dt>
        <dd className="text-ds-xl font-bold text-ds-blue-900">
          {orderCount.toLocaleString("ko-KR")}건
        </dd>
      </dl>
    </div>
  );
}
