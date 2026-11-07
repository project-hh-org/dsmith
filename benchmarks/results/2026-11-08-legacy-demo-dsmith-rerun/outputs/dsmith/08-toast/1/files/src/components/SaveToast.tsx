"use client";

import { Button } from "./ui/button";

export interface SaveToastProps {
  status: "success" | "error";
  message?: string;
  onClose: () => void;
}

const defaultMessages = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다.",
};

// 토큰에 성공용 초록색이 없어 성공은 blue-400, 실패는 red-500 으로 구분한다.
const accent = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

export function SaveToast({ status, message, onClose }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderLeft: `4px solid ${accent[status]}`,
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--text-xs)",
        color: "var(--color-blue-900)",
      }}
    >
      <span style={{ flex: 1 }}>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
