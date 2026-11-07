"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface SaveToastProps {
  type: "success" | "error";
  title?: string;
  children?: ReactNode;
  onClose: () => void;
  className?: string;
}

const DEFAULT_TITLE = {
  success: "저장되었습니다",
  error: "저장하지 못했습니다",
} as const;

export function SaveToast({ type, title, children, onClose, className }: SaveToastProps) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg w-[360px]",
        type === "success" && "border-green-500",
        type === "error" && "border-red-500",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "mt-[2px] text-sm font-semibold",
          type === "success" && "text-green-600",
          type === "error" && "text-red-500",
        )}
      >
        {type === "success" ? "✓" : "!"}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title ?? DEFAULT_TITLE[type]}</p>
        {children && <p className="mt-1 text-sm text-gray-500">{children}</p>}
      </div>
      <button onClick={onClose} aria-label="닫기" className="text-gray-500">
        ✕
      </button>
    </div>
  );
}
