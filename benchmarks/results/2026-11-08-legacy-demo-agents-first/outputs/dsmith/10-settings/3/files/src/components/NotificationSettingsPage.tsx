"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "앱 푸시로 알림을 받아요." },
];

export interface NotificationSettingsPageProps {
  initialValues?: Partial<Record<ChannelKey, boolean>>;
  onSave?: (values: Record<ChannelKey, boolean>) => void;
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: initialValues?.email ?? true,
    sms: initialValues?.sms ?? false,
    push: initialValues?.push ?? true,
  });

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        padding: "var(--space-5)",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--color-blue-900)",
        }}
      >
        알림 설정
      </h1>

      <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: 0, listStyle: "none" }}>
        {channels.map(({ key, label, description }) => (
          <li
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              padding: "var(--space-4)",
              background: "var(--color-gray-50)",
              border: "1px solid var(--color-gray-100)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <label htmlFor={`notif-${key}`} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{ color: "var(--color-blue-900)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>{description}</span>
            </label>
            <input
              id={`notif-${key}`}
              type="checkbox"
              role="switch"
              checked={values[key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.checked }))}
              style={{ width: "var(--space-5)", height: "var(--space-5)", accentColor: "var(--color-blue-400)" }}
            />
          </li>
        ))}
      </ul>

      <Button type="button" onClick={() => onSave?.(values)} style={{ alignSelf: "flex-end" }}>
        저장
      </Button>
    </main>
  );
}
