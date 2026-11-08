import { moduleKeyOf, parseTsx, type ModuleContext, type TextPatch, type TsPaths } from "@dsmith-dev/core";
import { specifierForModule } from "./specifier.js";

// ───────────────────────── 최소 AST 모양 ─────────────────────────

export interface Base {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number } };
}
export interface Id extends Base {
  name: string;
}
export interface StrLit extends Base {
  value: string;
}
export interface Spec extends Base {
  local: Id;
  imported?: Id | StrLit;
  importKind?: string | null;
}
export interface ImportDecl extends Base {
  specifiers: Spec[];
  source: StrLit;
  importKind?: string | null;
}

export interface DeclEntry {
  node: ImportDecl;
  /** `moduleKeyOf`로 푼 module 키 */
  key: string;
}

// ───────────────────────── 공용 import 편집(컴포넌트 import 이동·테마 import 추가가 함께 쓴다) ─────────────────────────

/** `Name` 또는 `Name as local` */
export function renderedImportBinding(imported: string, local: string): string {
  return local === imported ? imported : `${imported} as ${local}`;
}

/**
 * 새 import 한 줄. 따옴표·세미콜론은 `style` 선언을 따른다.
 * `kind`가 default면 `import local from "spec"`, 아니면 `import { imported [as local] } from "spec"`
 */
export function renderImportLine(
  code: string,
  style: ImportDecl,
  spec: string,
  binding: { kind: "named" | "default"; imported: string; local: string },
): string {
  const q = code[style.source.start] === "'" ? "'" : '"';
  const semi = code[style.end - 1] === ";" ? ";" : "";
  return binding.kind === "default"
    ? `import ${binding.local} from ${q}${spec}${q}${semi}`
    : `import { ${renderedImportBinding(binding.imported, binding.local)} } from ${q}${spec}${q}${semi}`;
}

/** 기존 선언 중 같은 module의 named import(값)를 합칠 곳. `removing`은 통째로 사라질 선언 */
export function findMergeTarget(
  decls: DeclEntry[],
  module: string,
  local: string,
  removing: ReadonlySet<ImportDecl> = new Set(),
): { node: ImportDecl; last: Spec } | null {
  for (const { node, key } of decls) {
    if (removing.has(node) || key !== module || node.importKind === "type" || node.importKind === "typeof") continue;
    if (node.specifiers.some((s) => s.type === "ImportNamespaceSpecifier" || s.local.name === local)) continue;
    const named = node.specifiers.filter((s) => s.type === "ImportSpecifier");
    const last = named[named.length - 1];
    if (last !== undefined) return { node, last };
  }
  return null;
}

export function importDeclsOf(body: Base[], file: string, tsPaths: TsPaths | null, moduleContext: ModuleContext): DeclEntry[] {
  return body
    .filter((s) => s.type === "ImportDeclaration")
    .map((s) => {
      const node = s as ImportDecl;
      return { node, key: moduleKeyOf(file, node.source.value, tsPaths, moduleContext) };
    });
}
