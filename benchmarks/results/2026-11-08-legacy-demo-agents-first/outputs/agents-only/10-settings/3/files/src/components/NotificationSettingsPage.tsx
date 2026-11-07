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
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <label htmlFor={id} style={{ display: "block", cursor: "pointer" }}>
        <span style={{ display: "block", color: "var(--color-blue-900)" }}>{label}</span>
        <span
          style={{
            display: "block",
            marginTop: "var(--space-2)",
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
          width: "calc(var(--space-5) * 2)",
          height: "var(--space-5)",
          border: "none",
          borderRadius: "var(--radius-full)",
          cursor: "pointer",
          background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
          transition: "background 0.15s",
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(values);
      }}
      style={{ maxWidth: "calc(var(--space-5) * 24)", padding: "var(--space-5)" }}
    >
      <h1
        style={{
          margin: 0,
          marginBottom: "var(--space-4)",
          fontSize: "var(--text-xl)",
          color: "var(--color-blue-900)",
        }}
      >
        알림 설정
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
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
      </div>
      <div style={{ marginTop: "var(--space-5)" }}>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
