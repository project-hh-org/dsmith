// dsmith init 스캐폴드 — Badge (추천: src/components/Badge, 결정 전)
// 원 사용처 상위 2: app/customers/page.tsx (1회), app/orders/page.tsx (1회)
// TODO: 원 구현을 옮기고 하드코딩 값 대신 design-system/tokens.css 변수를 쓰세요. 고치기 전에는 결정이 바뀌면 dsmith가 다시 만들고, 고친 뒤에는 덮어쓰지 않습니다.

export interface BadgeProps {
  children: React.ReactNode;
  color?: "blue" | "gray" | "red";
  status?: unknown; // TODO: 타입 확인 (사용처에서만 관측)
}

export function Badge() {
  // TODO: 구현 — 받을 props는 BadgeProps 참고
  return null;
}
