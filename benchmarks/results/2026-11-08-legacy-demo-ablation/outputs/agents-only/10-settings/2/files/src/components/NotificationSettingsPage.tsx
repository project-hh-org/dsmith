import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string }[] = [
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
      <label htmlFor={id} style={{ color: "var(--color-blue-900)" }}>
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
          width: 40,
          height: 24,
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: "pointer",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-500)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 20,
            height: 20,
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
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        maxWidth: 480,
        padding: "var(--space-5)",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "var(--text-xl)",
          color: "var(--color-blue-900)",
        }}
      >
        알림 설정
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {channels.map(({ key, label }) => (
          <Toggle
            key={key}
            id={`notification-${key}`}
            label={label}
            checked={values[key]}
            onChange={(checked) => setValues((prev) => ({ ...prev, [key]: checked }))}
          />
        ))}
      </div>
      <div>
        <Button onClick={() => onSave?.(values)}>저장</Button>
      </div>
    </section>
  );
}

export default NotificationSettingsPage;
