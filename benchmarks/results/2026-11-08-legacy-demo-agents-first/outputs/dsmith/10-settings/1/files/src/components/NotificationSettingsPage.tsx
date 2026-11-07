"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받습니다." },
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
    <div className="flex items-center justify-between gap-ds-4 py-ds-3">
      <label htmlFor={id} className="block">
        <span className="block font-medium text-ds-blue-900">{label}</span>
        <span className="block text-ds-xs text-ds-gray-500">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-ds-full transition-colors ${
          checked ? "bg-ds-blue-400" : "bg-ds-gray-100"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-ds-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
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
    <main className="mx-auto w-full max-w-xl p-ds-5">
      <h1 className="text-ds-xl font-semibold text-ds-blue-900">알림 설정</h1>
      <section className="mt-ds-4 rounded-ds-sm bg-ds-gray-50 p-ds-4">
        <div className="divide-y divide-ds-gray-100">
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
      </section>
      <div className="mt-ds-4 flex justify-end">
        <Button type="button" onClick={() => onSave?.(values)}>
          저장
        </Button>
      </div>
    </main>
  );
}
