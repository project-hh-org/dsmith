"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 알림을 받습니다." },
];

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

// DS에 토글 컴포넌트가 없어 토큰 변수로 로컬 구현
function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "calc(var(--space-5) * 2)",
        height: "var(--space-5)",
        padding: "calc(var(--space-2) / 4)",
        flexShrink: 0,
        border: "none",
        cursor: "pointer",
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        justifyContent: checked ? "flex-end" : "flex-start",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: "calc(var(--space-5) - var(--space-2) / 2)",
          height: "calc(var(--space-5) - var(--space-2) / 2)",
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-50)",
        }}
      />
    </button>
  );
}

export function NotificationSettingsPage() {
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  const handleSave = () => {
    // TODO: 저장 API 연결
    console.log("notification settings", values);
  };

  return (
    <section style={{ maxWidth: "calc(var(--space-5) * 24)", padding: "var(--space-5)" }}>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          color: "var(--color-blue-900)",
          margin: 0,
          marginBottom: "var(--space-4)",
        }}
      >
        알림 설정
      </h1>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {channels.map(({ key, label, description }) => (
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
            <label htmlFor={`notif-${key}`} style={{ display: "block" }}>
              <span style={{ display: "block", color: "var(--color-blue-900)" }}>{label}</span>
              <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
                {description}
              </span>
            </label>
            <Toggle
              id={`notif-${key}`}
              label={label}
              checked={values[key]}
              onChange={(checked) => setValues((prev) => ({ ...prev, [key]: checked }))}
            />
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </section>
  );
}

export default NotificationSettingsPage;
