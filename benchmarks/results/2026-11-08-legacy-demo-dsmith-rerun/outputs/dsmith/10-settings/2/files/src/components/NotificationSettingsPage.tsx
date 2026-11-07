import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 알림을 받습니다." },
];

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}

function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: "calc(var(--space-5) * 2)",
        height: "var(--space-5)",
        flexShrink: 0,
        border: "none",
        padding: 0,
        cursor: "pointer",
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-blue-400)" : "var(--color-gray-100)",
        transition: "background 150ms",
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
          transition: "left 150ms",
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

  const handleSave = () => {
    // TODO: 저장 API 연결
    console.log("save notification settings", settings);
  };

  return (
    <section
      style={{
        maxWidth: "calc(var(--space-5) * 24)",
        margin: "0 auto",
        padding: "var(--space-5)",
        color: "var(--color-blue-900)",
      }}
    >
      <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
        알림 설정
      </h1>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-3)" }}>
        {channels.map(({ key, label, description }) => (
          <li
            key={key}
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
            <div>
              <div style={{ fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
                {description}
              </div>
            </div>
            <Toggle
              checked={settings[key]}
              label={label}
              onChange={(next) => setSettings((prev) => ({ ...prev, [key]: next }))}
            />
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-5)", display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </section>
  );
}

export default NotificationSettingsPage;
