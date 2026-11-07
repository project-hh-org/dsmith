import type { ReactNode } from "react";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 기본 문구 대신 보여줄 메시지 */
  children?: ReactNode;
  onClose: () => void;
  className?: string;
}

const defaultMessage: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

const accent: Record<SaveToastStatus, string> = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

export function SaveToast({ status, children, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={className}
      style={{
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
      }}
    >
      <span style={{ flex: 1 }}>{children ?? defaultMessage[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
