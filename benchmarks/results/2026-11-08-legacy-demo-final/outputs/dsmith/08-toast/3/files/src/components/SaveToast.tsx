import type { CSSProperties } from "react";
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

const accent: Record<SaveToastStatus, string> = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

const baseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-3) var(--space-4)",
  background: "var(--color-gray-50)",
  color: "var(--color-blue-900)",
  fontSize: "var(--text-xs)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

export function SaveToast({ status, message, onClose }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      style={{ ...baseStyle, borderLeft: `var(--space-2) solid ${accent[status]}` }}
    >
      <span style={{ flex: 1 }}>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
