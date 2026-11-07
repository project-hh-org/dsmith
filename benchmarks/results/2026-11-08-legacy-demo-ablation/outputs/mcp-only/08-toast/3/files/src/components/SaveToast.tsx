import clsx from "clsx";
import type { ReactNode } from "react";

interface SaveToastProps {
  status: "success" | "error";
  onClose: () => void;
  children?: ReactNode;
}

const DEFAULT_MESSAGE = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다.",
} as const;

// 색상·간격·반경은 design-system/tokens.css의 CSS 변수를 사용한다.
// (tailwind preset이 아직 config에 연결되지 않아 arbitrary value로 참조)
export function SaveToast({ status, onClose, children }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-gray-50)] text-[length:var(--text-xs)]",
        status === "success" && "border-[var(--color-blue-400)] text-[var(--color-blue-900)]",
        status === "error" && "border-[var(--color-red-500)] text-[var(--color-red-500)]",
      )}
    >
      <span aria-hidden="true">{status === "success" ? "✓" : "!"}</span>
      <span className="flex-1">{children ?? DEFAULT_MESSAGE[status]}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-[var(--color-gray-500)]"
      >
        ✕
      </button>
    </div>
  );
}
