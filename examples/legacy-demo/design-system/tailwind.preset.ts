// dsmith init이 생성한 파일입니다. 직접 고치면 다음 init이 덮어쓰지 않습니다(--force로 덮어씀).
// tailwind.config의 presets에 추가하세요: import dsPreset from "./design-system/tailwind.preset"; … presets: [dsPreset]
export default {
  theme: {
    extend: {
      colors: {
        "ds-blue-400": "var(--color-blue-400)",
        "ds-blue-900": "var(--color-blue-900)",
        "ds-red-500": "var(--color-red-500)",
        "ds-gray-50": "var(--color-gray-50)",
        "ds-gray-500": "var(--color-gray-500)",
        "ds-gray-100": "var(--color-gray-100)",
      },
      spacing: {
        "ds-2": "var(--space-2)",
        "ds-3": "var(--space-3)",
        "ds-4": "var(--space-4)",
        "ds-5": "var(--space-5)",
      },
      borderRadius: {
        "ds-sm": "var(--radius-sm)",
        "ds-full": "var(--radius-full)",
      },
      fontSize: {
        "ds-xs": "var(--text-xs)",
        "ds-xl": "var(--text-xl)",
      },
    },
  },
};
