import clsx from "clsx";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다. 다시 시도해 주세요.",
};

// 색은 tokens.css 변수만 사용한다. (성공: blue-400, 실패: red-500)
const accent: Record<SaveToastStatus, string> = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx("flex items-center", className)}
      style={{
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-sm)",
        border: `1px solid var(--color-gray-100)`,
        borderLeft: `4px solid ${accent[status]}`,
        background: "var(--color-gray-50)",
        color: "var(--color-blue-900)",
        fontSize: "var(--text-xs)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "var(--space-2)",
          height: "var(--space-2)",
          borderRadius: "var(--radius-full)",
          background: accent[status],
          flexShrink: 0,
        }}
      />
      <p className="flex-1">{message ?? defaultMessages[status]}</p>
      <Button type="button" variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
