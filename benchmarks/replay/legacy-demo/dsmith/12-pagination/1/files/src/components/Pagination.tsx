import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageCount, onChange }: Props) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className="flex items-center gap-[var(--ds-space-2)]" style={{ marginTop: 12 }} aria-label="페이지 이동">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          className={p === page ? "bg-[color:var(--ds-color-brand)]" : "text-[color:var(--ds-color-gray-900)]"}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button variant="ghost" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </nav>
  );
}
