import type { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
}

export function Select({ label, options, ...rest }: SelectProps) {
  return (
    <label className="block text-sm text-gray-700">
      {label}
      <select
        {...rest}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-[var(--space-4)] py-2"
        style={{ color: "var(--color-blue-900)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
