import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface SaveToastProps {
  status: "success" | "error";
  /** 기본 문구 대신 보여줄 메시지 */
  message?: string;
  onClose: () => void;
}

const defaultMessages = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다. 다시 시도해 주세요.",
} as const;

// 성공/실패 구분 색은 토큰만 사용 (성공: blue-400, 실패: red-500)
const accent = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
} as const;

export function SaveToast({ status, message, onClose }: SaveToastProps) {
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-3) var(--space-4)",
    background: "var(--color-gray-50)",
    color: "var(--color-blue-900)",
    border: "1px solid var(--color-gray-100)",
    borderLeft: `var(--space-2) solid ${accent[status]}`,
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
  };

  return (
    <div role={status === "error" ? "alert" : "status"} style={style}>
      <span style={{ flex: 1 }}>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
