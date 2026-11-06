import { Badge } from "@/components/Badge";

export type CustomerGrade = "VIP" | "일반" | "휴면";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: CustomerGrade;
}

const GRADE_COLOR = { VIP: "blue", 일반: "gray", 휴면: "red" } as const;

// 고객 요약 카드: 이름·이메일·누적 주문 수·회원 등급
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="min-w-[240px] rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold text-gray-900">{name}</p>
        <Badge color={GRADE_COLOR[grade]}>{grade}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-500">{email}</p>
      <p className="mt-3 text-xs text-gray-500">누적 주문</p>
      <p className="text-2xl font-bold text-gray-900">{orderCount.toLocaleString("ko-KR")}건</p>
    </div>
  );
}
