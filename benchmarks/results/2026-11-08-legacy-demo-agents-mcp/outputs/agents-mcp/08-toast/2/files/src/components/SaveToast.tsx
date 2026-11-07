import clsx from "clsx";
import { Button } from "./ui/button";

const statusStyles = {
  success: "border-[var(--color-blue-400)]",
  error: "border-[var(--color-red-500)]",
};

const defaultMessages = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

export interface SaveToastProps {
  status: keyof typeof statusStyles;
  /** 생략하면 status에 맞는 기본 문구를 보여줍니다. */
  message?: string;
  onClose: () => void;
  className?: string;
}

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center justify-between border bg-[var(--color-gray-50)] text-[var(--color-blue-900)]",
        "gap-[var(--space-3)] p-[var(--space-4)] rounded-[var(--radius-sm)] text-[length:var(--text-xs)]",
        statusStyles[status],
        className,
      )}
    >
      <span>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
