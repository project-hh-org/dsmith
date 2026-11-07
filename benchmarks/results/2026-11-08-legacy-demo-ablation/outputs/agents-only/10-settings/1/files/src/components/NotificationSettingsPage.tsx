"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Channel = "email" | "sms" | "push";

const channels: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받습니다." },
];

interface NotificationSettingsPageProps {
  initialValues?: Partial<Record<Channel, boolean>>;
  onSave?: (values: Record<Channel, boolean>) => void;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex shrink-0 items-center transition-colors"
      style={{
        width: "calc(var(--space-5) * 2)",
        height: "var(--space-5)",
        borderRadius: "var(--radius-full)",
        backgroundColor: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
      }}
    >
      <span
        className="absolute bg-white transition-transform"
        style={{
          top: "2px",
          left: "2px",
          width: "calc(var(--space-5) - 4px)",
          height: "calc(var(--space-5) - 4px)",
          borderRadius: "var(--radius-full)",
          transform: checked ? "translateX(var(--space-5))" : "translateX(0)",
        }}
      />
    </button>
  );
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email: initialValues?.email ?? true,
    sms: initialValues?.sms ?? false,
    push: initialValues?.push ?? true,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(values);
      }}
      className="mx-auto w-full max-w-md"
      style={{ padding: "var(--space-5)" }}
    >
      <h1
        className="font-semibold"
        style={{ fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}
      >
        알림 설정
      </h1>

      <ul
        className="list-none"
        style={{ margin: "var(--space-4) 0", padding: 0, display: "grid", gap: "var(--space-3)" }}
      >
        {channels.map(({ key, label, description }) => (
          <li
            key={key}
            className="flex items-center justify-between"
            style={{
              gap: "var(--space-4)",
              padding: "var(--space-4)",
              border: "1px solid var(--color-gray-100)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-gray-50)",
            }}
          >
            <div>
              <p className="font-medium" style={{ color: "var(--color-blue-900)" }}>
                {label}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
                {description}
              </p>
            </div>
            <Toggle
              label={label}
              checked={values[key]}
              onChange={(next) => setValues((prev) => ({ ...prev, [key]: next }))}
            />
          </li>
        ))}
      </ul>

      <Button type="submit">저장</Button>
    </form>
  );
}
