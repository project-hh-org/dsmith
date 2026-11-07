"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "주문·정산 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "중요한 알림을 문자 메시지로 받습니다." },
  { key: "push", label: "푸시 알림", description: "브라우저 푸시로 실시간 알림을 받습니다." },
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
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="block text-sm text-gray-700">
        <span className="block font-medium text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          checked ? "bg-brand" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsPage() {
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: false,
    push: true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="page-title">알림 설정</h1>

      <section className="bg-white rounded-lg p-4 space-y-4 border border-gray-300">
        <h2 className="font-semibold text-gray-900">알림 채널</h2>
        {channels.map((c) => (
          <Toggle
            key={c.key}
            id={`notify-${c.key}`}
            label={c.label}
            description={c.description}
            checked={values[c.key]}
            onChange={(checked) => setValues((prev) => ({ ...prev, [c.key]: checked }))}
          />
        ))}
      </section>

      <div className="mt-4">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}

export default NotificationSettingsPage;
