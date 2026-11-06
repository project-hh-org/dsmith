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
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
}

function Toggle({ id, checked, onChange, labelledBy }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-[var(--radius-full)] transition-colors ${
        checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-[var(--radius-full)] bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationSettingsPageProps {
  initialValues?: Partial<NotificationSettings>;
  onSave?: (settings: NotificationSettings) => void;
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    ...initialValues,
  });

  return (
    <form
      className="mx-auto max-w-xl p-[var(--space-5)]"
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(settings);
      }}
    >
      <h1 className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        알림 설정
      </h1>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        받고 싶은 알림 채널을 선택하세요.
      </p>

      <ul className="mt-[var(--space-4)] divide-y divide-[var(--color-gray-100)] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-[var(--color-gray-50)]">
        {channels.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between gap-[var(--space-4)] p-[var(--space-4)]">
            <div>
              <div id={`${key}-label`} className="font-medium text-[var(--color-blue-900)]">
                {label}
              </div>
              <div className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{description}</div>
            </div>
            <Toggle
              id={`${key}-toggle`}
              labelledBy={`${key}-label`}
              checked={settings[key]}
              onChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
            />
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-4)] flex justify-end">
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
