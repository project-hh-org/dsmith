"use client";

import clsx from "clsx";
import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const CHANNELS: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받습니다." },
];

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-ds-full transition-colors",
        checked ? "bg-ds-blue-400" : "bg-ds-gray-100",
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 rounded-ds-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
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
    <section className="mx-auto flex w-full max-w-xl flex-col gap-ds-5 p-ds-5">
      <h1 className="text-ds-xl font-semibold text-ds-blue-900">알림 설정</h1>

      <ul className="flex flex-col divide-y divide-ds-gray-100 rounded-ds-sm bg-ds-gray-50">
        {CHANNELS.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between gap-ds-4 p-ds-4">
            <div className="flex flex-col gap-ds-2">
              <span className="font-medium text-ds-blue-900">{label}</span>
              <span className="text-ds-xs text-ds-gray-500">{description}</span>
            </div>
            <Toggle
              label={label}
              checked={values[key]}
              onChange={(next) => setValues((prev) => ({ ...prev, [key]: next }))}
            />
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Button onClick={() => onSave?.(values)}>저장</Button>
      </div>
    </section>
  );
}
