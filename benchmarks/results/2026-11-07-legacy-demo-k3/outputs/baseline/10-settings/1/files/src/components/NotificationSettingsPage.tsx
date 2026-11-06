"use client";

import clsx from "clsx";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "주문·정산 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "중요한 알림을 문자 메시지로 받습니다." },
  { key: "push", label: "푸시 알림", description: "브라우저와 앱 푸시로 실시간 알림을 받습니다." },
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
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-gray-300",
        )}
      >
        <span
          className={clsx(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [enabled, setEnabled] = useState<Record<ChannelKey, boolean>>({
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

      <section className="bg-white rounded-lg p-4 space-y-4 border border-gray-200">
        <h2 className="font-semibold text-gray-900">알림 수신 방법</h2>
        {channels.map((c) => (
          <Toggle
            key={c.key}
            id={`notify-${c.key}`}
            label={c.label}
            description={c.description}
            checked={enabled[c.key]}
            onChange={(checked) => setEnabled((prev) => ({ ...prev, [c.key]: checked }))}
          />
        ))}
      </section>

      <div className="mt-4">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "처리 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
