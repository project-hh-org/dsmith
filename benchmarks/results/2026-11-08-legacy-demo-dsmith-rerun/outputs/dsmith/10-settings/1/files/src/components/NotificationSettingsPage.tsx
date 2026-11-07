"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Channel = "email" | "sms" | "push";

const channels: { key: Channel; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받아요." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받아요." },
  { key: "push", label: "푸시 알림", description: "기기로 바로 알림을 받아요." },
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
    <div className="flex items-center justify-between gap-[var(--space-4)] py-[var(--space-3)]">
      <div>
        <label htmlFor={id} className="block font-medium text-[var(--color-blue-900)]">
          {label}
        </label>
        <p className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-[var(--radius-full)] transition-colors " +
          (checked ? "bg-[var(--color-blue-400)]" : "bg-[var(--color-gray-100)]")
        }
      >
        <span
          className={
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-[var(--radius-full)] bg-white transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

export interface NotificationSettingsPageProps {
  initialValues?: Partial<Record<Channel, boolean>>;
  onSave?: (values: Record<Channel, boolean>) => void;
}

export function NotificationSettingsPage({ initialValues, onSave }: NotificationSettingsPageProps) {
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email: initialValues?.email ?? true,
    sms: initialValues?.sms ?? false,
    push: initialValues?.push ?? true,
  });

  return (
    <main className="mx-auto w-full max-w-xl p-[var(--space-5)]">
      <h1 className="mb-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        알림 설정
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.(values);
        }}
      >
        <section className="rounded-lg bg-[var(--color-gray-50)] px-[var(--space-4)]">
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
        </section>
        <div className="mt-[var(--space-4)] flex justify-end">
          <Button type="submit">저장</Button>
        </div>
      </form>
    </main>
  );
}
