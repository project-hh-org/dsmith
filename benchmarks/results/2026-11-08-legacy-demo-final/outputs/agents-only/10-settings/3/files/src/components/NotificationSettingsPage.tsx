import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "기기로 바로 알림을 받아요." },
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
        padding: "var(--space-4)",
        borderBottom: "1px solid var(--color-gray-100)",
      }}
    >
      <label htmlFor={id} style={{ display: "block", cursor: "pointer" }}>
        <span style={{ display: "block", color: "var(--color-blue-900)" }}>{label}</span>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-xs)",
            color: "var(--color-gray-500)",
          }}
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
        style={{
          position: "relative",
          flexShrink: 0,
          width: "44px",
          height: "24px",
          border: "none",
          cursor: "pointer",
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
          transition: "background 0.15s",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-gray-50)",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsPage() {
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <main style={{ padding: "var(--space-5)", maxWidth: "560px" }}>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          color: "var(--color-blue-900)",
          marginBottom: "var(--space-4)",
        }}
      >
        알림 설정
      </h1>

      <section
        style={{
          border: "1px solid var(--color-gray-100)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {channels.map((c) => (
          <Toggle
            key={c.key}
            id={`notification-${c.key}`}
            label={c.label}
            description={c.description}
            checked={values[c.key]}
            onChange={(checked) => setValues((prev) => ({ ...prev, [c.key]: checked }))}
          />
        ))}
      </section>

      <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
        <Button type="button">저장</Button>
      </div>
    </main>
  );
}
