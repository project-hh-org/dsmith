import clsx from "clsx";

interface SaveToastProps {
  status: "success" | "error";
  /** 기본 문구 대신 보여줄 메시지 */
  message?: string;
  onClose: () => void;
}

const DEFAULT_MESSAGE = {
  success: "저장했습니다.",
  error: "저장하지 못했습니다. 다시 시도해 주세요.",
} as const;

// 색상은 design-system/tokens.css 변수를 쓰고, 값이 없을 때를 대비해 토큰 원본 값을 fallback으로 둠
export function SaveToast({ status, message, onClose }: SaveToastProps) {
  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={clsx(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg",
        isError
          ? "bg-[var(--color-red-500,#e53e3e)]"
          : "bg-[var(--color-blue-400,#3b82f6)]",
      )}
    >
      <span aria-hidden="true">{isError ? "⚠" : "✓"}</span>
      <span>{message ?? DEFAULT_MESSAGE[status]}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="ml-2 text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
