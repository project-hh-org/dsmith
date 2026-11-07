import clsx from "clsx";
import type { HTMLAttributes } from "react";
import { Button } from "./ui/button";

const statusStyles = {
  success: "border-[var(--color-blue-400)]",
  error: "border-[var(--color-red-500)]",
};

const statusDot = {
  success: "bg-[var(--color-blue-400)]",
  error: "bg-[var(--color-red-500)]",
};

const defaultMessages = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다.",
};

export interface SaveToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  status: keyof typeof statusStyles;
  /** 기본 문구 대신 보여줄 메시지 */
  message?: string;
  onClose: () => void;
}

export function SaveToast({ status, message, onClose, className, ...props }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] border bg-[var(--color-gray-50)]",
        "rounded-[var(--radius-sm)] p-[var(--space-4)] text-[length:var(--text-xs)]",
        "text-[var(--color-blue-900)] shadow-lg",
        statusStyles[status],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={clsx("h-2 w-2 shrink-0 rounded-[var(--radius-full)]", statusDot[status])}
      />
      <span className="flex-1">{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
