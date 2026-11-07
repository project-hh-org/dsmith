import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 기본 메시지 대신 보여줄 문구 */
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 색은 토큰만 사용: 성공 = blue-400, 실패 = red-500
const accents: Record<SaveToastStatus, string> = {
  success: "border-l-[var(--color-blue-400)]",
  error: "border-l-[var(--color-red-500)]",
};

const dots: Record<SaveToastStatus, string> = {
  success: "bg-[var(--color-blue-400)]",
  error: "bg-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center border border-l-4 border-[var(--color-gray-100)] bg-[var(--color-gray-50)] text-[color:var(--color-blue-900)]",
        "gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-sm)] text-[length:var(--text-xs)]",
        accents[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx("h-2 w-2 shrink-0 rounded-[var(--radius-full)]", dots[status])}
      />
      <span className="flex-1">{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
