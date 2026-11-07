import clsx from "clsx";
import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아봅니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 바로 푸시 알림을 받습니다." },
];

interface ToggleProps {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, checked, label, onChange }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 shrink-0 rounded-ds-full transition-colors",
        checked ? "bg-ds-blue-400" : "bg-ds-gray-100",
      )}
    >
      <span
        className={clsx(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-ds-full bg-white transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function NotificationSettingsPage({ onSave }: { onSave?: (settings: Record<ChannelKey, boolean>) => void }) {
  const [settings, setSettings] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <section className="mx-auto max-w-xl p-ds-5">
      <h1 className="text-ds-xl font-semibold text-ds-blue-900">알림 설정</h1>
      <ul className="mt-ds-4 divide-y divide-ds-gray-100">
        {channels.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between gap-ds-4 py-ds-4">
            <div>
              <label htmlFor={`notification-${key}`} className="font-medium text-ds-blue-900">
                {label}
              </label>
              <p className="mt-1 text-ds-xs text-ds-gray-500">{description}</p>
            </div>
            <Toggle
              id={`notification-${key}`}
              label={label}
              checked={settings[key]}
              onChange={(checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-ds-5 flex justify-end">
        <Button onClick={() => onSave?.(settings)}>저장</Button>
      </div>
    </section>
  );
}
