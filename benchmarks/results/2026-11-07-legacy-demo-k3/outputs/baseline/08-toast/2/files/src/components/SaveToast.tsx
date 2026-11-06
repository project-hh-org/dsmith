"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface SaveToastProps {
  status: "success" | "error";
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

// 저장 결과 알림. 표시 여부와 자동 닫힘 타이머는 호출하는 쪽에서 관리한다.
export function SaveToast({ status, children, onClose, className }: SaveToastProps) {
  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={clsx(
        "flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg",
        isError ? "bg-red-500" : "bg-green-600",
        className,
      )}
    >
      <span aria-hidden="true">{isError ? "✕" : "✓"}</span>
      <p className="flex-1">{children}</p>
      <button onClick={onClose} aria-label="닫기" className="text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  );
}
