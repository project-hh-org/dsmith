"use client";

import clsx from "clsx";
import { Button } from "./ui/button";

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수(tailwind.preset의 ds-* 클래스)만 사용한다.
// 성공/실패 전용 색 토큰이 없어 성공은 blue-400, 실패는 red-500을 쓴다.
const statusStyles = {
  success: {
    accent: "border-l-ds-blue-400",
    icon: "bg-ds-blue-400",
    mark: "✓",
    role: "status" as const,
  },
  error: {
    accent: "border-l-ds-red-500",
    icon: "bg-ds-red-500",
    mark: "!",
    role: "alert" as const,
  },
};

export interface SaveToastProps {
  status: keyof typeof statusStyles;
  /** 토스트 본문 (예: "저장했어요", "저장하지 못했어요") */
  message: string;
  /** 본문 아래 보조 설명 */
  description?: string;
  onClose: () => void;
  className?: string;
}

export function SaveToast({ status, message, description, onClose, className }: SaveToastProps) {
  const s = statusStyles[status];

  return (
    <div
      role={s.role}
      className={clsx(
        "flex items-start gap-ds-3 rounded-ds-sm border border-ds-gray-100 border-l-4 bg-ds-gray-50 p-ds-4",
        s.accent,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex h-ds-5 w-ds-5 shrink-0 items-center justify-center rounded-ds-full text-ds-xs text-ds-gray-50",
          s.icon,
        )}
      >
        {s.mark}
      </span>
      <div className="flex-1">
        <p className="text-ds-xs font-medium text-ds-blue-900">{message}</p>
        {description ? <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{description}</p> : null}
      </div>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
        ✕
      </Button>
    </div>
  );
}
