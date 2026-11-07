import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

export interface SaveToastProps {
  status: "success" | "error";
  children?: ReactNode;
  onClose: () => void;
  className?: string;
}

const defaultMessages = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다.",
};

const statusStyles = {
  success: "border-ds-blue-400",
  error: "border-ds-red-500",
};

export function SaveToast({ status, children, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-ds-3 rounded-ds-sm border-l-4 bg-ds-gray-50 px-ds-4 py-ds-3",
        "text-ds-xs text-ds-blue-900",
        statusStyles[status],
        className,
      )}
    >
      <span className="flex-1">{children ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
