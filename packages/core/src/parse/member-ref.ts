import type { File } from "@babel/types";
import type { StyleUsage } from "@dsmith-dev/extractor-api";

/** 로컬 이름 → 가져온 곳. 값 import만 담는다(`import type`은 제외). namespace는 `imported: "*"`, default는 `"default"` */
export type ImportTable = Map<string, { specifier: string; imported: string }>;

export function importTableOf(ast: File): ImportTable {
  const table: ImportTable = new Map();
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ImportDeclaration" || stmt.importKind === "type" || stmt.importKind === "typeof") continue;
    const specifier = stmt.source.value;
    for (const spec of stmt.specifiers) {
      if (spec.type === "ImportDefaultSpecifier") {
        table.set(spec.local.name, { specifier, imported: "default" });
      } else if (spec.type === "ImportNamespaceSpecifier") {
        table.set(spec.local.name, { specifier, imported: "*" });
      } else if (spec.importKind !== "type" && spec.importKind !== "typeof") {
        const imported = spec.imported.type === "Identifier" ? spec.imported.name : spec.imported.value;
        table.set(spec.local.name, { specifier, imported });
      }
    }
  }
  return table;
}

const MEMBER_CHAIN =
  /^([A-Za-z_$][\w$]*)((?:\s*\.\s*[A-Za-z_$][\w$]*|\s*\[\s*(?:\d+|"[^"\\]*"|'[^'\\]*')\s*\])+)$/;
const SEGMENT = /\.\s*([A-Za-z_$][\w$]*)|\[\s*(?:(\d+)|"([^"\\]*)"|'([^'\\]*)')\s*\]/g;

/**
 * 멤버 식 소스 텍스트(`colors.surface`, `theme.space[2]`, `t.colors["a-b"]`)가 import 바인딩에서 시작하면 `StyleUsage.ref`를 돌려준다.
 * 계산 접근(`colors.mode[x]`)·옵셔널 체인·호출·import 아닌 루트는 undefined.
 */
export function memberRefOf(text: string, imports: ImportTable): NonNullable<StyleUsage["ref"]> | undefined {
  const match = MEMBER_CHAIN.exec(text.trim());
  if (match === null) return undefined;
  const root = imports.get(match[1]!);
  if (root === undefined) return undefined;
  const path: string[] = [];
  for (const seg of match[2]!.matchAll(SEGMENT)) {
    path.push(seg[1] ?? seg[2] ?? seg[3] ?? seg[4] ?? "");
  }
  if (path.length === 0) return undefined;
  return { specifier: root.specifier, imported: root.imported, path };
}
