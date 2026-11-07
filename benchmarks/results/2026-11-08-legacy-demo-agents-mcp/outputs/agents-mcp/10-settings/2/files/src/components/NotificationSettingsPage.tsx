"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const CHANNELS: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받습니다." },
];

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        padding: "var(--space-3) 0",
        borderBottom: "1px solid var(--color-gray-100)",
      }}
    >
      <label htmlFor={id} style={{ display: "block", cursor: "pointer" }}>
        <span style={{ display: "block", color: "var(--color-blue-900)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
          {description}
        </span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          flexShrink: 0,
          width: "var(--space-5)",
          minWidth: 44,
          height: "var(--space-5)",
          minHeight: 24,
          border: "none",
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "var(--radius-full)",
            background: "var(--color-gray-50)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsPage({
  initial = { email: true, sms: false, push: true },
  onSave,
}: {
  initial?: Record<ChannelKey, boolean>;
  onSave?: (settings: Record<ChannelKey, boolean>) => void;
}) {
  const [settings, setSettings] = useState(initial);

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--space-5)" }}>
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
      <section
        style={{
          background: "var(--color-gray-50)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-2) var(--space-4)",
        }}
      >
        {CHANNELS.map((c) => (
          <Toggle
            key={c.key}
            id={`notification-${c.key}`}
            label={c.label}
            description={c.description}
            checked={settings[c.key]}
            onChange={(v) => setSettings((s) => ({ ...s, [c.key]: v }))}
          />
        ))}
      </section>
      <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
        <Button type="button" onClick={() => onSave?.(settings)}>
          저장
        </Button>
      </div>
    </main>
  );
}
