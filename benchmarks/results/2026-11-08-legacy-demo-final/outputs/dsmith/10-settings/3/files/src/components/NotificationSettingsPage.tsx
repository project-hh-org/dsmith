"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받아요." },
];

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-[var(--space-5)] w-[var(--space-5)] shrink-0 items-center rounded-[var(--radius-full)] transition-colors " +
        "w-[calc(var(--space-5)*2)] " +
        (checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]")
      }
    >
      <span
        className={
          "inline-block h-[var(--space-4)] w-[var(--space-4)] rounded-[var(--radius-full)] bg-[var(--color-gray-50)] transition-transform " +
          (checked ? "translate-x-[var(--space-5)]" : "translate-x-[2px]")
        }
      />
    </button>
  );
}

export function NotificationSettingsPage({
  onSave,
}: {
  onSave?: (settings: Record<ChannelKey, boolean>) => void;
}) {
  const [settings, setSettings] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <main className="mx-auto w-full max-w-md p-[var(--space-5)]">
      <section className="flex flex-col gap-[var(--space-4)]">
        <h1 className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">알림 설정</h1>

        <ul className="flex flex-col">
          {channels.map(({ key, label, description }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-[var(--space-4)] border-b border-[var(--color-gray-100)] py-[var(--space-3)]"
            >
              <label htmlFor={`notify-${key}`} className="flex flex-col gap-[var(--space-2)]">
                <span className="font-medium text-[var(--color-blue-900)]">{label}</span>
                <span className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{description}</span>
              </label>
              <Toggle
                id={`notify-${key}`}
                label={label}
                checked={settings[key]}
                onChange={(value) => setSettings((prev) => ({ ...prev, [key]: value }))}
              />
            </li>
          ))}
        </ul>

        <Button className="self-end" onClick={() => onSave?.(settings)}>
          저장
        </Button>
      </section>
    </main>
  );
}
