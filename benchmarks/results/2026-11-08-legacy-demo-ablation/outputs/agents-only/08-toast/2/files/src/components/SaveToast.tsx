import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 기본 문구 대신 보여줄 메시지 */
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 성공/실패 색은 디자인 토큰(CSS 변수)만 사용: 성공=blue-400, 실패=red-500
const statusStyles: Record<SaveToastStatus, string> = {
  success: "border-l-[var(--color-blue-400)]",
  error: "border-l-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center justify-between border border-l-4 border-[var(--color-gray-100)]",
        "gap-[var(--space-3)] p-[var(--space-4)] rounded-[var(--radius-sm)]",
        "bg-[var(--color-gray-50)] text-[var(--color-blue-900)] text-[length:var(--text-xs)]",
        statusStyles[status],
        className,
      )}
    >
      <p>{message ?? defaultMessages[status]}</p>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
