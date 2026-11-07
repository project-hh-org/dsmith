import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  message?: string;
  onClose: () => void;
  className?: string;
}

const statusStyles: Record<SaveToastStatus, { accent: string; title: string; defaultMessage: string }> = {
  success: {
    accent: "border-l-[var(--color-blue-400)]",
    title: "저장 완료",
    defaultMessage: "변경 사항이 저장되었습니다.",
  },
  error: {
    accent: "border-l-[var(--color-red-500)]",
    title: "저장 실패",
    defaultMessage: "저장하지 못했습니다. 다시 시도해 주세요.",
  },
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  const { accent, title, defaultMessage } = statusStyles[status];

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-start gap-[var(--space-3)] border border-l-4 border-[var(--color-gray-100)]",
        "rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-4)] shadow-lg",
        accent,
        className,
      )}
    >
      <div className="flex-1">
        <p className="text-[length:var(--text-xs)] font-semibold text-[var(--color-blue-900)]">{title}</p>
        <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{message ?? defaultMessage}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" aria-label="토스트 닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
