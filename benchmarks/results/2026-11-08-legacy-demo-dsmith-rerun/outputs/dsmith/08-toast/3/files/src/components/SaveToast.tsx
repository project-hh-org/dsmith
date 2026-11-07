"use client";

import clsx from "clsx";
import { Button } from "./ui/button";

export interface SaveToastProps {
  /** 저장 결과: 성공 또는 실패 */
  status: "success" | "error";
  /** 표시할 메시지. 없으면 기본 문구를 쓴다. */
  message?: string;
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다. 다시 시도해 주세요.",
};

// 성공/실패는 토큰 색(blue-400 / red-500)의 왼쪽 강조선과 아이콘으로 구분한다.
const accents = {
  success: "border-l-ds-blue-400 text-ds-blue-400",
  error: "border-l-ds-red-500 text-ds-red-500",
};

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      // 실패는 즉시 읽히도록 alert, 성공은 status로 알린다.
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-ds-3 rounded-ds-sm border border-ds-gray-100 border-l-4 bg-ds-gray-50 p-ds-4 text-ds-xs text-ds-blue-900",
        accents[status].split(" ")[0],
        className,
      )}
    >
      <span aria-hidden="true" className={clsx("font-semibold", accents[status].split(" ")[1])}>
        {status === "success" ? "✓" : "!"}
      </span>
      <p className="flex-1">{message ?? defaultMessages[status]}</p>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
        ✕
      </Button>
    </div>
  );
}
