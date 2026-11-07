import clsx from "clsx";
import type { ReactNode } from "react";

interface BadgeProps {
  color?: "blue" | "gray" | "red";
  children: ReactNode;
}

export function Badge({ color = "gray", children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2 py-[3px] text-xs",
        color === "blue" && "bg-[color:var(--color-blue-400)] text-white",
        color === "red" && "bg-[color:var(--color-red-500)] text-white",
        color === "gray" && "bg-gray-100 text-gray-700",
      )}
    >
      {children}
    </span>
  );
}
