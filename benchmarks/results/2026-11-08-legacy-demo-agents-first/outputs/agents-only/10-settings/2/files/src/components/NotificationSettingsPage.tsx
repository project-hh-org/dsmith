import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 바로 알려드려요." },
];

export interface NotificationSettingsPageProps {
  initial?: Partial<Record<ChannelKey, boolean>>;
  onSave?: (values: Record<ChannelKey, boolean>) => void;
}

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
      className={`relative h-6 w-11 shrink-0 rounded-[var(--radius-full)] transition-colors ${
        checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-[var(--radius-full)] bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function NotificationSettingsPage({ initial, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: initial?.email ?? true,
    sms: initial?.sms ?? false,
    push: initial?.push ?? true,
  });

  return (
    <form
      className="flex max-w-xl flex-col gap-[var(--space-5)] p-[var(--space-5)]"
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(values);
      }}
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        알림 설정
      </h2>

      <ul className="flex flex-col gap-[var(--space-3)]">
        {channels.map((c) => (
          <li
            key={c.key}
            className="flex items-center justify-between gap-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
          >
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className="font-medium text-[var(--color-blue-900)]">{c.label}</span>
              <span className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
                {c.description}
              </span>
            </div>
            <Toggle
              label={c.label}
              checked={values[c.key]}
              onChange={(next) => setValues((v) => ({ ...v, [c.key]: next }))}
            />
          </li>
        ))}
      </ul>

      <div>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}

export default NotificationSettingsPage;
