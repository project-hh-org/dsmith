import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface SaveToastProps {
  status: "success" | "error";
  message?: string;
  onClose: () => void;
}

const defaultMessages = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다.",
};

// 토큰에 성공 전용 색이 없어 success는 blue-400, error는 red-500을 쓴다.
const accent = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

export function SaveToast({ status, message, onClose }: SaveToastProps) {
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-3) var(--space-4)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderLeft: `var(--space-2) solid ${accent[status]}`,
    borderRadius: "var(--radius-sm)",
    color: "var(--color-blue-900)",
    fontSize: "var(--text-xs)",
  };

  return (
    <div role={status === "error" ? "alert" : "status"} style={style}>
      <span style={{ flex: 1 }}>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
