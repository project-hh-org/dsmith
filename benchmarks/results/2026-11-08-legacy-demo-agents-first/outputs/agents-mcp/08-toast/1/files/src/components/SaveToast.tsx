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

// 성공/실패 구분은 DS 토큰의 파랑(blue-400)·빨강(red-500)으로 한다. (DS에 초록 토큰이 없음)
const accents = {
  success: "border-ds-blue-400",
  error: "border-ds-red-500",
} as const;

export function SaveToast({ status, message, onClose, className }: SaveToastProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={clsx(
        "flex items-center gap-ds-3 rounded-ds-sm border-l-4 bg-ds-gray-50 px-ds-4 py-ds-3 text-ds-xs text-ds-blue-900",
        accents[status],
        className,
      )}
    >
      <span className="flex-1">{message ?? defaultMessages[status]}</span>
      <Button variant="ghost" size="sm" aria-label="닫기" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
