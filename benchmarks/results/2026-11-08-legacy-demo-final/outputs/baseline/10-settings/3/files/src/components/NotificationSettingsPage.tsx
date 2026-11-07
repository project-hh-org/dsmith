"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="block text-sm text-gray-700">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="mt-1 block text-xs text-gray-500">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-gray-300"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [push, setPush] = useState(true);
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
        <Toggle id="notify-email" label="이메일 알림" description="주문·정산 소식을 이메일로 받습니다." checked={email} onChange={setEmail} />
        <Toggle id="notify-sms" label="SMS 알림" description="중요한 소식을 문자 메시지로 받습니다." checked={sms} onChange={setSms} />
        <Toggle id="notify-push" label="푸시 알림" description="브라우저·앱 푸시로 실시간 알림을 받습니다." checked={push} onChange={setPush} />
      </section>

      <div className="mt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
