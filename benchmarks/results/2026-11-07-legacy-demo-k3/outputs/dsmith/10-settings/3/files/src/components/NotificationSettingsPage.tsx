"use client";

import { useState } from "react";
import { Button } from "./ui/button";

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
  labelledBy: string;
}

function Toggle({ id, checked, onChange, labelledBy }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-[var(--space-5)] w-[var(--space-5)] shrink-0 items-center rounded-[var(--radius-full)] transition-colors " +
        (checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]")
      }
      style={{ width: "calc(var(--space-5) * 2)" }}
    >
      <span
        className="inline-block h-[var(--space-4)] w-[var(--space-4)] rounded-[var(--radius-full)] bg-[var(--color-gray-50)] transition-transform"
        style={{
          transform: checked ? "translateX(calc(var(--space-5) + 2px))" : "translateX(2px)",
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
    <form
      className="mx-auto w-full max-w-md p-[var(--space-5)]"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: 저장 API 연결
      }}
    >
      <h1 className="mb-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        알림 설정
      </h1>

      <ul className="divide-y divide-[var(--color-gray-100)]">
        {channels.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between gap-[var(--space-4)] py-[var(--space-3)]">
            <div>
              <p id={`${key}-label`} className="text-[var(--color-blue-900)]">
                {label}
              </p>
              <p className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{description}</p>
            </div>
            <Toggle
              id={`${key}-toggle`}
              labelledBy={`${key}-label`}
              checked={settings[key]}
              onChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
            />
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-5)] flex justify-end">
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
