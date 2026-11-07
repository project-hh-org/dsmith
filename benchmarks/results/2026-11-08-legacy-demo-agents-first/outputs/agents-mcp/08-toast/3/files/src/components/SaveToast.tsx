"use client";

import clsx from "clsx";
import { Button } from "./ui/button";

export interface SaveToastProps {
  /** 저장 결과: 성공 또는 실패 */
  status: "success" | "error";
  /** 표시할 메시지. 없으면 기본 문구를 쓴다. */
  message?: string;
  /** 닫기 버튼 클릭 시 호출 */
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장했어요.",
  error: "저장하지 못했어요. 다시 시도해 주세요.",
} as const;

// 토큰에 성공 전용 색이 없어 성공은 blue-400, 실패는 red-500 로 구분한다.
const statusStyles = {
  success: "border-ds-blue-400",
  error: "border-ds-red-500",
} as const;

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center justify-between gap-ds-3 rounded-ds-sm border bg-ds-gray-50 p-ds-4 text-ds-xs text-ds-blue-900",
        statusStyles[status],
        className,
      )}
    >
      <span>{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
        ✕
      </Button>
    </div>
  );
}
