import clsx from "clsx";
import { Button } from "./ui/button";

export interface SaveToastProps {
  status: "success" | "error";
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

const accents = {
  success: "border-l-[var(--color-blue-400)]",
  error: "border-l-[var(--color-red-500)]",
};

const dots = {
  success: "bg-[var(--color-blue-400)]",
  error: "bg-[var(--color-red-500)]",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] border border-[var(--color-gray-100)] border-l-4",
        "bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]",
        "text-[length:var(--text-xs)] text-[var(--color-blue-900)]",
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
