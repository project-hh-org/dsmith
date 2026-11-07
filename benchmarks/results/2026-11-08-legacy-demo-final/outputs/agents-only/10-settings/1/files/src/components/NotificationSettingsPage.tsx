import { useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 알림을 받습니다." },
];

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-5)",
  maxWidth: 480,
  color: "var(--color-blue-900)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-3) var(--space-4)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const descriptionStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 40,
        height: 24,
        flexShrink: 0,
        border: "none",
        padding: 0,
        cursor: "pointer",
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "var(--space-2)",
          left: checked ? 20 : 4,
          width: 16,
          height: 16,
          marginTop: -4,
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-50)",
          transition: "left 0.15s",
        }}
      />
    </button>
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
    <section style={pageStyle}>
      <h1 style={titleStyle}>알림 설정</h1>
      {channels.map(({ key, label, description }) => (
        <div key={key} style={rowStyle}>
          <div>
            <div>{label}</div>
            <div style={descriptionStyle}>{description}</div>
          </div>
          <Toggle
            label={label}
            checked={values[key]}
            onChange={(next) => setValues((prev) => ({ ...prev, [key]: next }))}
          />
        </div>
      ))}
      <div>
        <Button onClick={() => onSave?.(values)}>저장</Button>
      </div>
    </section>
  );
}
