import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const CHANNELS: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시 알림을 받습니다." },
];

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface NotificationSettingsPageProps {
  initialSettings?: NotificationSettings;
  onSave?: (settings: NotificationSettings) => void;
}

export function NotificationSettingsPage({
  initialSettings = { email: true, sms: false, push: true },
  onSave,
}: NotificationSettingsPageProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);

  const toggle = (key: Channel) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <section className="mx-auto max-w-xl p-[var(--space-5)]">
      <h1 className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-blue-900)]">
        알림 설정
      </h1>

      <ul className="mt-[var(--space-4)] divide-y divide-[color:var(--color-gray-100)]">
        {CHANNELS.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between py-[var(--space-3)]">
            <div>
              <p className="text-[color:var(--color-blue-900)]">{label}</p>
              <p className="text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
                {description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings[key]}
              aria-label={label}
              onClick={() => toggle(key)}
              className={`relative h-6 w-11 rounded-[var(--radius-full)] transition-colors ${
                settings[key] ? "bg-[color:var(--color-blue-400)]" : "bg-[color:var(--color-gray-100)]"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-[var(--radius-full)] bg-[color:var(--color-gray-50)] shadow transition-transform ${
                  settings[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-4)] flex justify-end">
        <Button onClick={() => onSave?.(settings)}>저장</Button>
      </div>
    </section>
  );
}
