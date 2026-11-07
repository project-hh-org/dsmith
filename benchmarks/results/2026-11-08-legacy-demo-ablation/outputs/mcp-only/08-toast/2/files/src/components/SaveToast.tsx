import clsx from "clsx";

interface SaveToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

// 디자인 토큰(design-system/tokens.css)의 CSS 변수를 사용한다.
// tailwind preset(ds-*)이 아직 tailwind.config에 연결되어 있지 않아 arbitrary value로 참조함.
export function SaveToast({ type, message, onClose }: SaveToastProps) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={clsx(
        "flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border border-l-4",
        "bg-[var(--color-gray-50)] px-[var(--space-4)] py-[var(--space-3)]",
        "text-[length:var(--text-xs)] text-[var(--color-blue-900)]",
        isError
          ? "border-[var(--color-red-500)]"
          : "border-[var(--color-blue-400)]",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "font-semibold",
          isError ? "text-[var(--color-red-500)]" : "text-[var(--color-blue-400)]",
        )}
      >
        {isError ? "!" : "✓"}
      </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-[var(--color-gray-500)]"
      >
        ✕
      </button>
    </div>
  );
}
