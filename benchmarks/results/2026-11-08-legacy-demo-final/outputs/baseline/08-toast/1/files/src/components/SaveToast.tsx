"use client";

import clsx from "clsx";

interface SaveToastProps {
  variant?: "success" | "error";
  message?: string;
  onClose: () => void;
  className?: string;
}

const DEFAULT_MESSAGE = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다. 다시 시도해 주세요.",
} as const;

// 저장 결과 알림. 표시 여부와 자동 닫힘 타이머는 사용하는 쪽에서 관리한다.
export function SaveToast({ variant = "success", message, onClose, className }: SaveToastProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={clsx(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-md",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700",
        className,
      )}
    >
      <span aria-hidden="true" className="font-semibold">
        {isError ? "!" : "✓"}
      </span>
      <p className="flex-1 font-medium">{message ?? DEFAULT_MESSAGE[variant]}</p>
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
