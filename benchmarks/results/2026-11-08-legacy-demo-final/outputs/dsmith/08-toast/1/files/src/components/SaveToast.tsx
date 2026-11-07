import clsx from "clsx";
import type { HTMLAttributes } from "react";
import { Button } from "./ui/button";

const statusStyles = {
  success: {
    accent: "border-l-[var(--color-blue-400)]",
    role: "status",
    defaultMessage: "저장했어요.",
  },
  error: {
    accent: "border-l-[var(--color-red-500)]",
    role: "alert",
    defaultMessage: "저장하지 못했어요. 다시 시도해 주세요.",
  },
} as const;

export interface SaveToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  status: keyof typeof statusStyles;
  message?: string;
  onClose: () => void;
}

export function SaveToast({ status, message, onClose, className, ...props }: SaveToastProps) {
  const style = statusStyles[status];

  return (
    <div
      role={style.role}
      className={clsx(
        "flex items-center gap-[var(--space-3)] border border-l-4 border-[var(--color-gray-100)]",
        "bg-[var(--color-gray-50)] p-[var(--space-3)] text-[color:var(--color-blue-900)]",
        "rounded-[var(--radius-sm)] text-[length:var(--text-xs)]",
        style.accent,
        className,
      )}
      {...props}
    >
      <span className="flex-1">{message ?? style.defaultMessage}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
