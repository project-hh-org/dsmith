"use client";

import type { ReactNode } from "react";
import { Button } from "./ui/button";

export type SaveToastStatus = "success" | "error";

export interface SaveToastProps {
  status: SaveToastStatus;
  /** 토스트 본문. 없으면 상태별 기본 문구를 쓴다. */
  children?: ReactNode;
  onClose: () => void;
}

// 디자인 토큰(design-system/tokens.css)만 사용한다. 토큰에 초록이 없어 성공은 blue-400, 실패는 red-500.
const accent: Record<SaveToastStatus, string> = {
  success: "var(--color-blue-400)",
  error: "var(--color-red-500)",
};

const defaultMessage: Record<SaveToastStatus, string> = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
};

export function SaveToast({ status, children, onClose }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
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
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
        ✕
      </Button>
    </div>
  );
}
