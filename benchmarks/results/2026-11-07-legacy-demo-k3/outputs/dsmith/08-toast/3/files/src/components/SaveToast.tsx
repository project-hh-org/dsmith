import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  message: string;
  onClose: () => void;
  className?: string;
}

// 디자인 토큰(design-system/tailwind.preset.ts)만 사용한다.
// 토큰에 초록 계열이 없어 성공은 blue-400, 실패는 red-500 강조색으로 구분한다.
const statusStyles: Record<SaveToastStatus, { border: string; icon: string; mark: string }> = {
  success: { border: "border-ds-blue-400", icon: "bg-ds-blue-400", mark: "✓" },
  error: { border: "border-ds-red-500", icon: "bg-ds-red-500", mark: "!" },
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  const style = statusStyles[status];

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center gap-ds-3 rounded-ds-sm border bg-ds-gray-50 p-ds-4 text-ds-xs text-ds-blue-900",
        style.border,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex h-ds-5 w-ds-5 shrink-0 items-center justify-center rounded-ds-full text-ds-xs text-ds-gray-50",
          style.icon,
        )}
      >
        {style.mark}
      </span>
      <p className="flex-1">{message}</p>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
