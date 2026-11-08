import { moduleKeyOf, parseTsx, traverse, type ModuleContext, type TextPatch, type TsPaths } from "@dsmith-dev/core";
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

// ───────────────────────── 이름 있는 import 하나 보장하기(JS 테마 토큰 치환용) ─────────────────────────

export interface ImportNeed {
  /** root 상대 module 키(`src/theme`) */
  module: string;
  /** export 이름. `"default"`면 default import */
  name: string;
  isPath: true;
}

export type ImportPlan =
  /** 이미 값 import(별칭 포함). `local`은 이 파일에서 부르는 식(namespace import면 `t.colors`) */
  | { kind: "present"; local: string }
  /** 기존 같은 module 선언에 합치거나 새 줄(마지막 import 뒤) */
  | { kind: "add"; local: string; patch: TextPatch; convert?: { node: ImportDecl; keep: string } }
  /** 같은 로컬 이름이 다른 바인딩이거나 파일을 읽지 못함 */
  | { kind: "conflict"; reason: string };

/** default export를 받을 로컬 이름 */
const DEFAULT_LOCAL = "theme";

/**
 * `import type { a, b } from "m"`을 값 import로 바꾼 선언 텍스트. 선언의 `type`을 떼고, `keep`(값으로 쓸 로컬 이름들)이 아닌 지정자는
 * 인라인 `type`을 붙여 타입 전용으로 남긴다(`import { a, type b } from "m"`).
 */
function valueImportText(code: string, node: ImportDecl, keep: ReadonlySet<string>): string {
  let text = code.slice(node.start, node.end);
  const edits: { at: number; del: number; ins: string }[] = [];
  // `import type {` → `import {` (type 앞 공백과 type만 지우고 뒤 공백은 남긴다)
  const kw = /^import(\s+)type(?=[\s{*])/.exec(text);
  if (kw !== null) edits.push({ at: "import".length, del: kw[1]!.length + "type".length, ins: "" });
  for (const s of node.specifiers) {
    if (s.type === "ImportSpecifier" && !keep.has(s.local.name)) edits.push({ at: s.start - node.start, del: 0, ins: "type " });
  }
  for (const e of edits.sort((a, b) => b.at - a.at)) text = `${text.slice(0, e.at)}${e.ins}${text.slice(e.at + e.del)}`;
  return text;
}

/** 이 로컬 이름을 가진 바인딩이 파일 어느 스코프에든 있는가(import·변수·함수·매개변수·클래스) */
function hasBindingNamed(ast: ReturnType<typeof parseTsx>, name: string, ignore: ReadonlySet<unknown>): boolean {
  let found = false;
  traverse(ast, {
    Scope(path) {
      if (found) return;
      const binding = path.scope.getOwnBinding(name);
      if (binding !== undefined && !ignore.has(binding.path.node)) found = true;
    },
  });
  return found;
}

/**
 * 한 파일에서 `module`의 `name`을 값으로 쓸 수 있게 하는 편집 계획(순수). 한 파일·한 export에 한 번 부른다.
 * - 값 import가 이미 있으면 present(별칭이면 별칭, namespace면 `ns.name`)
 * - 없으면 같은 module의 named 선언에 합치고, 그것도 없으면 마지막 import 뒤에 새 줄(따옴표·세미콜론은 그 import를 따름,
 *   tsconfig paths 별칭이 있으면 별칭 specifier)
 * - 같은 로컬 이름의 다른 바인딩(다른 module의 import·지역 변수·매개변수)이 있으면 conflict
 * `import type { name }`은 값이 아니다.
 */
export function planNamedImport(ctx: { file: string; code: string; tsPaths: TsPaths | null; moduleContext: ModuleContext }, need: ImportNeed): ImportPlan {
  const { file, code, tsPaths, moduleContext } = ctx;
  let ast;
  try {
    ast = parseTsx(code, file);
  } catch (err) {
    return { kind: "conflict", reason: `파싱 실패: ${err instanceof Error ? err.message : String(err)}` };
  }
  if ((ast.errors ?? []).length > 0) return { kind: "conflict", reason: "파싱 오류가 있는 파일" };
  const body = ast.program.body as unknown as Base[];
  const decls = importDeclsOf(body, file, tsPaths, moduleContext);
  const isDefault = need.name === "default";
  const wanted = isDefault ? DEFAULT_LOCAL : need.name;
  const isValueDecl = (d: ImportDecl): boolean => d.importKind !== "type" && d.importKind !== "typeof";
  const isValueSpec = (s: Spec): boolean => s.importKind !== "type" && s.importKind !== "typeof";

  // 이미 값 import가 있는가
  const importedNameOf = (s: Spec): string | null => (s.imported === undefined ? null : ((s.imported as Id).name ?? (s.imported as StrLit).value));
  const sameModule = new Set<unknown>();
  let typeOnly: { node: ImportDecl; spec: Spec } | null = null;
  for (const { node, key } of decls) {
    if (key !== need.module) continue;
    for (const s of node.specifiers) {
      if (!isValueDecl(node) || !isValueSpec(s)) {
        if (s.local.name === wanted) {
          sameModule.add(s); // 같은 module의 타입 import는 충돌로 보지 않는다
          const matches = isDefault ? s.type === "ImportDefaultSpecifier" : s.type === "ImportSpecifier" && importedNameOf(s) === need.name;
          if (matches && typeOnly === null) typeOnly = { node, spec: s };
        }
        continue;
      }
      if (isDefault && s.type === "ImportDefaultSpecifier") return { kind: "present", local: s.local.name };
      if (!isDefault && s.type === "ImportSpecifier" && importedNameOf(s) === need.name) return { kind: "present", local: s.local.name };
      if (!isDefault && s.type === "ImportNamespaceSpecifier") return { kind: "present", local: `${s.local.name}.${need.name}` };
    }
  }

  // 같은 로컬 이름의 다른 바인딩
  if (hasBindingNamed(ast, wanted, sameModule)) {
    return { kind: "conflict", reason: `\`${wanted}\` 이름이 이 파일에서 이미 다른 바인딩으로 쓰임` };
  }

  // 같은 module에서 같은 이름을 타입 전용으로만 import하고 있다 → 두 번째 선언을 더하지 않고 그 import를 값 import로 바꾼다
  if (typeOnly !== null) {
    const { node, spec: ts } = typeOnly;
    if (!isValueDecl(node)) {
      const patch = { start: node.start, end: node.end, replacement: valueImportText(code, node, new Set([wanted])) };
      return { kind: "add", local: wanted, patch, convert: { node, keep: wanted } };
    }
    // 인라인 `type colors` 지정자: 그 지정자의 `type` 키워드만 뗀다
    const text = code.slice(ts.start, ts.end).replace(/^type\s+/, "");
    return { kind: "add", local: wanted, patch: { start: ts.start, end: ts.end, replacement: text } };
  }

  const eol = code.includes("\r\n") ? "\r\n" : "\n";
  if (!isDefault) {
    const merge = findMergeTarget(decls, need.module, wanted);
    if (merge !== null) return { kind: "add", local: wanted, patch: { start: merge.last.end, end: merge.last.end, replacement: `, ${wanted}` } };
  }

  const spec = specifierForModule(file, need.module, tsPaths, need.isPath);
  const last = decls[decls.length - 1]?.node;
  const binding = { kind: isDefault ? ("default" as const) : ("named" as const), imported: need.name, local: wanted };
  if (last !== undefined) {
    const text = renderImportLine(code, last, spec, binding);
    return { kind: "add", local: wanted, patch: { start: last.end, end: last.end, replacement: `${eol}${text}` } };
  }
  // import가 하나도 없다: 지시문("use client") 뒤, 없으면 맨 앞
  const directives = (ast.program.directives ?? []) as unknown as Base[];
  const lastDirective = directives[directives.length - 1];
  const text = `import ${isDefault ? wanted : `{ ${renderedImportBinding(need.name, wanted)} }`} from "${spec}";`;
  return lastDirective === undefined
    ? { kind: "add", local: wanted, patch: { start: 0, end: 0, replacement: `${text}${eol}` } }
    : { kind: "add", local: wanted, patch: { start: lastDirective.end, end: lastDirective.end, replacement: `${eol}${text}` } };
}

/**
 * 한 파일에서 여러 export의 import를 한 번에 계획한다(순수). 같은 선언에 합치는 것끼리, 같은 module의 새 줄끼리는 한 편집·한 줄로 묶는다
 * (`import { colors, spacing } from "../theme"`). `plans`는 중복을 뺀 `needs`와 같은 순서.
 */
export function planNamedImports(
  ctx: { file: string; code: string; tsPaths: TsPaths | null; moduleContext: ModuleContext },
  needs: ImportNeed[],
): { plans: ImportPlan[]; patches: TextPatch[]; added: { module: string; name: string; local: string }[] } {
  const unique = needs.filter((n, i) => needs.findIndex((m) => m.module === n.module && m.name === n.name) === i);
  const plans = unique.map((n) => planNamedImport(ctx, n));
  const added: { module: string; name: string; local: string }[] = [];
  const groups = new Map<string, { start: number; end: number; text: string; lines: { module: string; named: boolean; at: number }[] }>();
  unique.forEach((n, i) => {
    const p = plans[i]!;
    if (p.kind !== "add") return;
    added.push({ module: n.module, name: n.name, local: p.local });
    if (p.convert !== undefined) {
      // 타입 전용 선언을 값 import로 바꾸는 편집은 선언 단위다 — 같은 선언에서 값이 필요한 이름을 모두 모아 한 번만 쓴다
      const same = unique.flatMap((m, j) => {
        const q = plans[j]!;
        return q.kind === "add" && q.convert?.node.start === p.convert!.node.start ? [q.convert.keep] : [];
      });
      const k = `convert:${p.convert.node.start}`;
      if (!groups.has(k)) {
        groups.set(k, { start: p.patch.start, end: p.patch.end, text: valueImportText(ctx.code, p.convert.node, new Set(same)), lines: [] });
      }
      return;
    }
    const key = `${p.patch.start}:${p.patch.end}`;
    const g = groups.get(key);
    if (g === undefined) {
      groups.set(key, { start: p.patch.start, end: p.patch.end, text: p.patch.replacement, lines: [{ module: n.module, named: n.name !== "default", at: 0 }] });
      return;
    }
    const isMerge = p.patch.replacement.startsWith(", ");
    const sameModule = g.lines.find((l) => l.module === n.module && l.named && n.name !== "default");
    if (isMerge) {
      g.text += p.patch.replacement; // `, colors` + `, spacing`
    } else if (sameModule !== undefined) {
      // 같은 module의 새 줄에는 지정자만 더한다
      const close = g.text.indexOf(" } from ", sameModule.at);
      g.text = `${g.text.slice(0, close)}, ${renderedImportBinding(n.name, p.local)}${g.text.slice(close)}`;
    } else {
      g.lines.push({ module: n.module, named: n.name !== "default", at: g.text.length });
      g.text += p.patch.replacement;
    }
  });
  const patches = [...groups.values()].map((g) => ({ start: g.start, end: g.end, replacement: g.text }));
  return { plans, patches, added };
}
