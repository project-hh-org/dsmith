"use client";

import clsx from "clsx";

interface SaveToastProps {
  open: boolean;
  status: "success" | "error";
  message?: string;
  onClose: () => void;
}

const DEFAULT_MESSAGE = {
  success: "저장되었습니다.",
  error: "저장에 실패했습니다. 다시 시도해 주세요.",
} as const;

export function SaveToast({ open, status, message, onClose }: SaveToastProps) {
  if (!open) return null;

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-md",
        status === "success" && "border-green-200 bg-green-50 text-green-800",
        status === "error" && "border-red-200 bg-red-50 text-red-800",
      )}
    >
      <span aria-hidden="true">{status === "success" ? "✓" : "!"}</span>
      <span>{message ?? DEFAULT_MESSAGE[status]}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="ml-2 text-gray-500"
      >
        ✕
      </button>
    </div>
  );
}
