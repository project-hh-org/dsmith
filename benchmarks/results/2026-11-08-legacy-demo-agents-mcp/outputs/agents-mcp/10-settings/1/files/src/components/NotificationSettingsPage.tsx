import clsx from "clsx";
import { useState } from "react";
import { Button } from "./ui/button";

type ChannelKey = "email" | "sms" | "push";

const channels: { key: ChannelKey; label: string; description: string }[] = [
  { key: "email", label: "이메일 알림", description: "중요한 소식을 이메일로 받습니다." },
  { key: "sms", label: "SMS 알림", description: "문자 메시지로 알림을 받습니다." },
  { key: "push", label: "푸시 알림", description: "기기 푸시로 알림을 받습니다." },
];

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
}

function Toggle({ id, checked, onChange, labelledBy }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-ds-5 w-[calc(var(--space-5)*2)] shrink-0 rounded-ds-full transition-colors",
        checked ? "bg-ds-blue-400" : "bg-ds-gray-100",
      )}
    >
      <span
        className={clsx(
          "absolute top-1/2 left-[calc(var(--space-4)/8)] h-ds-4 w-ds-4 -translate-y-1/2 rounded-ds-full bg-ds-gray-50 transition-transform",
          checked && "translate-x-ds-5",
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
    email: true,
    sms: false,
    push: true,
    ...initialValues,
  });

  return (
    <form
      className="flex flex-col gap-ds-5 p-ds-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.(values);
      }}
    >
      <h1 className="text-ds-xl font-semibold text-ds-blue-900">알림 설정</h1>

      <ul className="flex flex-col gap-ds-3">
        {channels.map(({ key, label, description }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-ds-4 rounded-ds-sm bg-ds-gray-50 p-ds-4"
          >
            <div className="flex flex-col gap-ds-2">
              <span id={`${key}-label`} className="font-medium text-ds-blue-900">
                {label}
              </span>
              <span className="text-ds-xs text-ds-gray-500">{description}</span>
            </div>
            <Toggle
              id={`${key}-toggle`}
              labelledBy={`${key}-label`}
              checked={values[key]}
              onChange={(checked) => setValues((prev) => ({ ...prev, [key]: checked }))}
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
