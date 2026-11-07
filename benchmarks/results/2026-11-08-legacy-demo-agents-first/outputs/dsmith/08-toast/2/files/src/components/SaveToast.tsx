import clsx from "clsx";
import { Button } from "./ui/button";

export interface SaveToastProps {
  /** 저장 결과: 성공 또는 실패 */
  status: "success" | "error";
  /** 표시할 메시지. 없으면 기본 문구를 쓴다. */
  message?: string;
  /** 닫기 버튼을 눌렀을 때 호출된다. */
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 색은 토큰 변수만 쓴다 (design-system/tokens.css).
const accents = {
  success: "border-l-[var(--color-blue-400)]",
  error: "border-l-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] border border-l-4 border-[var(--color-gray-100)]",
        "bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]",
        "text-[length:var(--text-xs)] text-[var(--color-blue-900)] shadow-lg",
        accents[status],
        className,
      )}
    >
      <p className="flex-1">{message ?? defaultMessages[status]}</p>
      <Button type="button" variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ×
      </Button>
    </div>
  );
}
