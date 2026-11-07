"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const CHANNELS: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 실시간 알림을 받습니다." },
];

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

// DS에 토글 컴포넌트가 없어 토큰 변수만 사용해 로컬로 구성
function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[var(--space-5)] w-[calc(var(--space-5)*2)] shrink-0 items-center rounded-[var(--radius-full)] transition-colors ${
        checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]"
      }`}
    >
      <span
        className={`inline-block h-[var(--space-4)] w-[var(--space-4)] rounded-[var(--radius-full)] bg-white transition-transform ${
          checked ? "translate-x-[calc(var(--space-5)+2px)]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<Channel, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  const handleSave = () => {
    // TODO: 저장 API 연결
    console.log("notification settings", settings);
  };

  return (
    <section className="mx-auto w-full max-w-md p-[var(--space-4)]">
      <h1 className="mb-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        알림 설정
      </h1>

      <ul className="flex flex-col gap-[var(--space-3)]">
        {CHANNELS.map(({ key, label, description }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
          >
            <div>
              <p className="font-medium text-[var(--color-blue-900)]">{label}</p>
              <p className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{description}</p>
            </div>
            <Toggle
              checked={settings[key]}
              label={label}
              onChange={(v) => setSettings((prev) => ({ ...prev, [key]: v }))}
            />
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-5)] flex justify-end">
        <Button onClick={handleSave}>저장</Button>
      </div>
    </section>
  );
}
