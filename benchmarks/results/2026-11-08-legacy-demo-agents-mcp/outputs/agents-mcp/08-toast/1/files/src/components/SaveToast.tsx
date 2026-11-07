"use client";

import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  message?: string;
  onClose: () => void;
}

const defaultMessages: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

// 색은 design-system/tokens.css 변수만 사용 (성공: blue-400, 실패: red-500)
const accentVar: Record<SaveToastStatus, string> = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

export function SaveToast({ status, message, onClose }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className="flex items-center"
      style={{
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${accentVar[status]}`,
        borderLeftWidth: "var(--space-2)",
        background: "var(--color-gray-50)",
        color: "var(--color-blue-900)",
        fontSize: "var(--text-xs)",
      }}
    >
      <span className="flex-1">{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
        ✕
      </Button>
    </div>
  );
}
