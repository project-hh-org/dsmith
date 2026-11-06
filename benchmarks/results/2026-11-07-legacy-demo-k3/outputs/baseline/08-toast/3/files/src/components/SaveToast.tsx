"use client";

import clsx from "clsx";

interface SaveToastProps {
  status: "success" | "error";
  message?: string;
  onClose: () => void;
  className?: string;
}

const DEFAULT_MESSAGE = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다. 다시 시도해 주세요.",
} as const;

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={clsx(
        "flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg",
        isError ? "border-red-500" : "border-brand",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex h-5 w-5 items-center justify-center rounded-full text-xs text-white",
          isError ? "bg-red-500" : "bg-brand",
        )}
      >
        {isError ? "!" : "✓"}
      </span>
      <p className="flex-1 text-gray-900">{message ?? DEFAULT_MESSAGE[status]}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-gray-500 hover:text-gray-900"
      >
        ✕
      </button>
    </div>
  );
}
