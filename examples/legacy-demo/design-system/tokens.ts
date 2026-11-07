// dsmith init이 생성한 파일입니다. 직접 고치면 다음 init이 덮어쓰지 않습니다(--force로 덮어씀).
export const tokens = {
  color: {
    "blue-400": "#3b82f6",
    "blue-900": "#111827",
    "red-500": "#e53e3e",
    "gray-50": "#f9fafb",
    "gray-500": "#6b7280",
    "gray-100": "#e5e7eb",
  },
  space: {
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
  },
  radius: {
    "sm": "4px",
    "full": "9999px",
  },
  text: {
    "xs": "13px",
    "xl": "22px",
  },
} as const;

export type Tokens = typeof tokens;
