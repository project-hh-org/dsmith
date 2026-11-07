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
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// DS에 토글 컴포넌트가 없어 토큰 변수만으로 만든 로컬 스위치
function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-[var(--space-4)] py-[var(--space-3)]">
      <label htmlFor={id} className="block">
        <span className="block font-medium text-[color:var(--color-blue-900)]">{label}</span>
        <span className="block text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
          {description}
        </span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "flex w-[calc(var(--space-5)*2)] shrink-0 items-center rounded-[var(--radius-full)] transition-colors " +
          (checked
            ? "justify-end bg-[color:var(--color-blue-400)]"
            : "justify-start bg-[color:var(--color-gray-100)]")
        }
      >
        <span className="block h-[var(--space-4)] w-[var(--space-4)] rounded-[var(--radius-full)] bg-[color:var(--color-gray-50)]" />
      </button>
    </div>
  );
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <main className="mx-auto max-w-xl p-[var(--space-5)]">
      <h1 className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-blue-900)]">
        알림 설정
      </h1>
      <section className="mt-[var(--space-4)] divide-y divide-[color:var(--color-gray-100)]">
        {channels.map((c) => (
          <Toggle
            key={c.key}
            id={`notification-${c.key}`}
            label={c.label}
            description={c.description}
            checked={settings[c.key]}
            onChange={(v) => setSettings((prev) => ({ ...prev, [c.key]: v }))}
          />
        ))}
      </section>
      <div className="mt-[var(--space-5)] flex justify-end">
        <Button type="button">저장</Button>
      </div>
    </main>
  );
}
