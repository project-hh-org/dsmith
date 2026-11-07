import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기로 푸시 알림을 받습니다." },
];

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
    <form
      className="mx-auto flex max-w-xl flex-col gap-ds-5 p-ds-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(values);
      }}
    >
      <h1 className="text-ds-xl font-semibold text-ds-blue-900">알림 설정</h1>

      <ul className="flex flex-col">
        {channels.map(({ key, label, description }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-ds-4 border-b border-ds-gray-100 py-ds-3"
          >
            <label htmlFor={`notif-${key}`} className="flex flex-col gap-ds-2">
              <span className="font-medium text-ds-blue-900">{label}</span>
              <span className="text-ds-xs text-ds-gray-500">{description}</span>
            </label>
            <input
              id={`notif-${key}`}
              type="checkbox"
              role="switch"
              checked={values[key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.checked }))}
              className="h-ds-5 w-ds-5 accent-ds-blue-400"
            />
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
