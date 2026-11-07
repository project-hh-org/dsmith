import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const channels: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 바로 알려드려요." },
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
      className="flex items-center justify-between"
      style={{
        gap: "var(--space-4)",
        padding: "var(--space-4)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <span className="block font-medium" style={{ color: "var(--color-blue-900)" }}>
          {label}
        </span>
        <span
          className="block"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}
        >
          {description}
        </span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-colors"
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        }}
      >
        <span
          className="absolute transition-all"
          style={{
            top: "2px",
            left: checked ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-gray-50)",
          }}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<Channel, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <main
      className="mx-auto max-w-xl"
      style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      <h1
        className="font-bold"
        style={{ fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}
      >
        알림 설정
      </h1>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
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

      <div className="flex justify-end">
        <Button type="button" onClick={() => console.log("save", settings)}>
          저장
        </Button>
      </div>
    </main>
  );
}
