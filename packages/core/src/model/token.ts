import type { StyleUsage } from "@dsmith-dev/extractor-api";

export interface Token {
  name: string;
  value: string;
  normalized: StyleUsage["normalized"];
  category: "color" | "spacing" | "radius" | "font-size";
  /** W3C 토큰의 DTCG 경로("color.blue-400"). CSS 변수에서 읽은 토큰은 없다 */
  path?: string;
  /** JS 테마 객체의 잎에서 읽은 토큰의 위치(module은 root 상대 확장자 뺀 module 키). light/dark 모드 아래면 mode */
  js?: { module: string; export: string; path: string[]; mode?: "light" | "dark" };
}

export interface TokenSet {
  source: string;
  tokens: Token[];
}
