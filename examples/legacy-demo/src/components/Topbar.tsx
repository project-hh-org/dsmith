import { theme } from "@/lib/theme";

interface TopbarProps {
  userName: string;
  unreadCount?: number;
}

export function Topbar({ userName, unreadCount = 0 }: TopbarProps) {
  return (
    <header
      style={{
        background: "var(--color-blue-900)",
        border: "1px solid var(--color-gray-100)",
        color: "#fff",
        padding: "10px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 600 }}>모노마켓 어드민</span>
      <span style={{ fontSize: "var(--text-xs)", color: theme.muted }}>
        {unreadCount > 0 && (
          <span
            title={`읽지 않은 알림 ${unreadCount}건`}
            style={{ backgroundColor: "var(--color-blue-400)", display: "inline-block", width: 8, height: 8, borderRadius: "var(--radius-sm)", marginRight: "var(--space-2)" }}
          />
        )}
        {userName} 님
      </span>
    </header>
  );
}
