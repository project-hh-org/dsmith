import { Badge } from "@/components/Badge";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 등급 문자열 → Badge 색상. 모르는 등급은 gray
const GRADE_COLOR: Record<string, "blue" | "gray" | "red"> = {
  VIP: "blue",
  GOLD: "blue",
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 min-w-[240px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold text-gray-900">{name}</p>
          <p className="mt-1 text-sm text-gray-500">{email}</p>
        </div>
        <Badge color={GRADE_COLOR[grade.toUpperCase()] ?? "gray"}>{grade}</Badge>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        누적 주문 <span className="font-bold text-gray-900">{orderCount.toLocaleString("ko-KR")}건</span>
      </p>
    </div>
  );
}
