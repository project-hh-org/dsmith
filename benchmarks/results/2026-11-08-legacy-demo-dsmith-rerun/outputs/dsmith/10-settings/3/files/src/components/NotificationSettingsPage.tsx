"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type Channel = "email" | "sms" | "push";

const channels: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 알림을 받습니다." },
];

export interface NotificationSettingsPageProps {
  initialValues?: Partial<Record<Channel, boolean>>;
  onSave?: (values: Record<Channel, boolean>) => void;
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email: false,
    sms: false,
    push: false,
    ...initialValues,
  });

  return (
    <main className="mx-auto w-full max-w-md p-[var(--space-5)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.(values);
        }}
      >
        <h1 className="mb-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[color:var(--color-blue-900)]">
          알림 설정
        </h1>

        <ul className="flex flex-col gap-[var(--space-3)]">
          {channels.map(({ key, label, description }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-[var(--space-4)] rounded-[var(--radius-sm)] border border-[color:var(--color-gray-100)] p-[var(--space-4)]"
            >
              <div>
                <p className="font-medium text-[color:var(--color-blue-900)]">{label}</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values[key]}
                aria-label={label}
                onClick={() => setValues((v) => ({ ...v, [key]: !v[key] }))}
                className={`relative h-6 w-11 shrink-0 rounded-[var(--radius-full)] transition-colors ${
                  values[key] ? "bg-[color:var(--color-blue-400)]" : "bg-[color:var(--color-gray-100)]"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-[var(--radius-full)] bg-[color:var(--color-gray-50)] shadow transition-transform ${
                    values[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-[var(--space-5)] flex justify-end">
          <Button type="submit">저장</Button>
        </div>
      </form>
    </main>
  );
}
