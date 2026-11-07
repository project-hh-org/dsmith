import clsx from "clsx";
import { Button } from "./ui/button";

const statusStyles = {
  success: "border-[var(--color-blue-400)]",
  error: "border-[var(--color-red-500)]",
};

export interface SaveToastProps {
  status: keyof typeof statusStyles;
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다.",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center justify-between gap-[var(--space-3)] border bg-[var(--color-gray-50)]",
        "rounded-[var(--radius-sm)] p-[var(--space-4)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]",
        statusStyles[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "h-[var(--space-2)] w-[var(--space-2)] shrink-0 rounded-[var(--radius-full)]",
          status === "success" ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-red-500)]",
        )}
      />
      <p className="flex-1">{message ?? defaultMessages[status]}</p>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
