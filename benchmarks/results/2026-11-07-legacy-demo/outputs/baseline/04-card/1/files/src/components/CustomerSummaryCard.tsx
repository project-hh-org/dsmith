import { Badge } from "@/components/Badge";

type CustomerGrade = "VIP" | "일반" | "휴면";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: CustomerGrade;
}

const GRADE_COLOR = {
  VIP: "blue",
  일반: "gray",
  휴면: "red",
} as const;

// 고객 상세/목록 상단에서 쓰는 요약 카드
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 min-w-[240px]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900">{name}</p>
        <Badge color={GRADE_COLOR[grade]}>{grade}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-500">{email}</p>

      <div className="mt-4 border-t border-gray-200 pt-3">
        <p className="text-sm text-gray-500">누적 주문</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{orderCount.toLocaleString("ko-KR")}건</p>
      </div>
    </div>
  );
}
