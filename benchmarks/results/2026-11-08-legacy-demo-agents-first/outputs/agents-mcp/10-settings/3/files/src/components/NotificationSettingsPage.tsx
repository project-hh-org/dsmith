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
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
}

function Toggle({ checked, onChange, labelledBy }: ToggleProps) {
  const knob = "var(--space-5)";
  const inset = "calc(var(--space-2) / 4)";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: "calc(var(--space-5) * 2)",
        height: "calc(var(--space-5) + var(--space-2) / 2)",
        borderRadius: "var(--radius-full)",
        border: "none",
        background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        transition: "background 150ms",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: inset,
          left: checked ? `calc(100% - ${knob} - ${inset})` : inset,
          width: knob,
          height: knob,
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-50)",
          transition: "left 150ms",
        }}
      />
    </button>
  );
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        padding: "var(--space-5)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--color-blue-900)",
        }}
      >
        알림 설정
      </h2>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {CHANNELS.map(({ key, label, description }) => (
          <li
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              padding: "var(--space-4)",
              background: "var(--color-gray-50)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div>
              <div
                id={`notif-${key}`}
                style={{ color: "var(--color-blue-900)", fontWeight: 500 }}
              >
                {label}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
                {description}
              </div>
            </div>
            <Toggle
              labelledBy={`notif-${key}`}
              checked={settings[key]}
              onChange={(next) => setSettings((prev) => ({ ...prev, [key]: next }))}
            />
          </li>
        ))}
      </ul>

      <div>
        <Button type="button">저장</Button>
      </div>
    </section>
  );
}

export default NotificationSettingsPage;
