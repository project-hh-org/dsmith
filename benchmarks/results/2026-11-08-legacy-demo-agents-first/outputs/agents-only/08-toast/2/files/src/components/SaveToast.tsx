import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 토스트 본문. 생략하면 상태별 기본 문구를 쓴다. */
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 색은 디자인 토큰(tailwind preset의 ds-*)만 사용한다.
const statusStyles: Record<SaveToastStatus, string> = {
  success: "border-ds-blue-400 bg-ds-gray-50 text-ds-blue-900",
  error: "border-ds-red-500 bg-ds-gray-50 text-ds-red-500",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center gap-ds-3 rounded-ds-sm border p-ds-4 text-ds-xs",
        statusStyles[status],
        className,
      )}
    >
      <p className="flex-1 font-medium">{message ?? defaultMessages[status]}</p>
      <Button type="button" variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
