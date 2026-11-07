import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

// 2021 어드민 1차 버전에서 쓰던 버튼. 새 화면에서는 ui/button 쓰라고 했지만 설정/상품은 그대로 둠
export default function PrimaryButton({ loading, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="px-[var(--space-4)] py-2 rounded-md text-white text-sm font-medium bg-[color:var(--color-blue-400)] hover:bg-[color:var(--color-blue-400)] disabled:opacity-50"
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}
