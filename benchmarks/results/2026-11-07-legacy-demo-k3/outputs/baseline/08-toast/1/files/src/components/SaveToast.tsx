"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface SaveToastProps {
  variant?: "success" | "error";
  /** 기본 문구 대신 보여줄 메시지 */
  children?: ReactNode;
  onClose: () => void;
  className?: string;
}

const DEFAULT_MESSAGE = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다. 다시 시도해 주세요.",
} as const;

export function SaveToast({ variant = "success", children, onClose, className }: SaveToastProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
        isError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700",
        className,
      )}
    >
      <span aria-hidden="true" className="font-semibold">
        {isError ? "✕" : "✓"}
      </span>
      <p className="flex-1 font-medium">{children ?? DEFAULT_MESSAGE[variant]}</p>
      <button onClick={onClose} aria-label="닫기" className="text-gray-500 hover:text-gray-900">
        ✕
      </button>
    </div>
  );
}
