import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const channels: { key: Channel; label: string }[] = [
  { key: "email", label: "이메일 알림" },
  { key: "sms", label: "SMS 알림" },
  { key: "push", label: "푸시 알림" },
];

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <label
        htmlFor={id}
        style={{ color: "var(--color-blue-900)", fontSize: "var(--text-xs)" }}
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: "calc(var(--space-5) * 2)",
          height: "var(--space-5)",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-500)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "calc(100% - var(--space-4) - 2px)" : "2px",
            width: "var(--space-4)",
            height: "var(--space-4)",
            borderRadius: "var(--radius-full)",
            background: "var(--color-gray-50)",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}

export interface NotificationSettingsPageProps {
  initialValues?: Partial<Record<Channel, boolean>>;
  onSave?: (values: Record<Channel, boolean>) => void;
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email: initialValues?.email ?? true,
    sms: initialValues?.sms ?? false,
    push: initialValues?.push ?? true,
  });

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        maxWidth: "480px",
        padding: "var(--space-5)",
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "var(--color-blue-900)",
          fontSize: "var(--text-xl)",
        }}
      >
        알림 설정
      </h1>
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {channels.map(({ key, label }) => (
          <Toggle
            key={key}
            id={`notification-${key}`}
            label={label}
            checked={values[key]}
            onChange={(checked) => setValues((prev) => ({ ...prev, [key]: checked }))}
          />
        ))}
      </section>
      <div>
        <Button type="button" onClick={() => onSave?.(values)}>
          저장
        </Button>
      </div>
    </main>
  );
}
