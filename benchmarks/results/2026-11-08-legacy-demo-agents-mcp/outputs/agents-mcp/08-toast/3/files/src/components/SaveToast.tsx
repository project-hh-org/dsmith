import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 토스트 본문. 없으면 상태별 기본 문구를 씁니다. */
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다. 다시 시도해 주세요.",
};

// 색은 design-system/tokens.css 변수만 사용한다.
const statusStyles: Record<SaveToastStatus, string> = {
  success: "border-[var(--color-blue-400)]",
  error: "border-[var(--color-red-500)]",
};

const markStyles: Record<SaveToastStatus, string> = {
  success: "bg-[var(--color-blue-400)]",
  error: "bg-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] border bg-[var(--color-gray-50)]",
        "rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-3)]",
        "text-[length:var(--text-xs)] text-[var(--color-blue-900)]",
        statusStyles[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "inline-flex h-[var(--space-5)] w-[var(--space-5)] shrink-0 items-center justify-center",
          "rounded-[var(--radius-full)] text-white",
          markStyles[status],
        )}
      >
        {status === "success" ? "✓" : "!"}
      </span>
      <p className="flex-1">{message ?? defaultMessages[status]}</p>
      <Button type="button" variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
