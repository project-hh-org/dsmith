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

const defaults: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수만 사용
const statusStyle: Record<SaveToastStatus, string> = {
  success: "border-[var(--color-blue-400)]",
  error: "border-[var(--color-red-500)]",
};

const dotStyle: Record<SaveToastStatus, string> = {
  success: "bg-[var(--color-blue-400)]",
  error: "bg-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center border bg-[var(--color-gray-50)] text-[var(--color-blue-900)]",
        "gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-sm)]",
        "text-[length:var(--text-xs)]",
        statusStyle[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx("h-2 w-2 shrink-0 rounded-[var(--radius-full)]", dotStyle[status])}
      />
      <span className="flex-1">{message ?? defaults[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
