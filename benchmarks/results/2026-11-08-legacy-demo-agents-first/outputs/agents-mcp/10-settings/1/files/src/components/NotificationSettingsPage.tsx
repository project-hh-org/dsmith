"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const CHANNELS: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시 알림을 받습니다." },
];

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
      style={{
        position: "relative",
        width: "calc(var(--space-5) * 2)",
        height: "var(--space-5)",
        flexShrink: 0,
        borderRadius: "var(--radius-full)",
        border: "none",
        cursor: "pointer",
        background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "calc(100% - var(--space-4) - 2px)" : "2px",
          width: "var(--space-4)",
          height: "var(--space-4)",
          borderRadius: "var(--radius-full)",
          background: "white",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

export function NotificationSettingsPage({
  initial,
  onSave,
}: {
  initial?: Partial<Record<Channel, boolean>>;
  onSave?: (values: Record<Channel, boolean>) => void;
}) {
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email: initial?.email ?? true,
    sms: initial?.sms ?? false,
    push: initial?.push ?? true,
  });

  return (
    <main style={{ maxWidth: 480, padding: "var(--space-5)" }}>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--color-blue-900)",
          marginBottom: "var(--space-4)",
        }}
      >
        알림 설정
      </h1>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {CHANNELS.map(({ key, label, description }) => (
          <li
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              padding: "var(--space-3) 0",
              borderBottom: "1px solid var(--color-gray-100)",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: "var(--color-blue-900)" }}>{label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
                {description}
              </div>
            </div>
            <Toggle
              label={label}
              checked={values[key]}
              onChange={(next) => setValues((v) => ({ ...v, [key]: next }))}
            />
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-5)" }}>
        <Button onClick={() => onSave?.(values)}>저장</Button>
      </div>
    </main>
  );
}

export default NotificationSettingsPage;
