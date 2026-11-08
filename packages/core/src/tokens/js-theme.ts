import type { Expression, Node, ObjectExpression, ObjectProperty } from "@babel/types";
import type { Token } from "../model/token.js";
import { parseTsx } from "../parse/tsx.js";
import { colorOf } from "./css-variables.js";

export interface JsThemeRead {
  tokens: Token[];
  /** 토큰을 하나 이상 낸 export 이름(소스 등장 순) */
  exports: string[];
  warnings: string[];
}

/** 결정 2a의 후보 glob: 기존 `TOKEN_FILES` 중 .ts/.js/.mjs ∪ 이름 관례 ∪ constants/·theme/ 디렉터리 */
export const JS_THEME_CANDIDATES: readonly string[] = [
  "**/{tokens,theme,design-tokens}.{ts,js,mjs}",
  "**/{theme,tokens,colors,Colors,palette}.{ts,js,mjs}",
  "**/constants/{Colors,Theme,theme}.{ts,js}",
  "**/theme/index.{ts,js}",
];

const SPACING_ANCESTOR = /^(spacing|space|spaces|gap|gaps|sizes?)$/i;
const RADIUS_ANCESTOR = /^(radius|radii|rounded|corners?)$/i;
const FONT_SIZE_ANCESTOR = /^(fontSizes?|textSizes?)$/i;

const MAX_DEPTH = 12;

type Mode = "light" | "dark";

/** `blue-400` → `blue400`, `2` → `2`(숫자 키), `2xl` → `_2xl`. RN `tokens.ts`의 키 */
export function jsKeyOf(key: string): string {
  if (/^(?:0|[1-9]\d*)$/.test(key)) return key;
  const cleaned = key.replace(/[^A-Za-z0-9_$]/g, "");
  if (cleaned === "") return "_";
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
}

function unwrap(expr: Node): Node {
  let current = expr;
  for (;;) {
    switch (current.type) {
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSTypeAssertion":
      case "TSNonNullExpression":
      case "ParenthesizedExpression":
        current = current.expression;
        break;
      default:
        return current;
    }
  }
}

interface ModuleScope {
  consts: Map<string, Expression>;
  /** 로컬 이름 → 가져온 곳 */
  imports: Map<string, { specifier: string; imported: string }>;
  /** export 이름 → 식 또는 로컬 이름 */
  exports: Map<string, { expr: Expression } | { local: string }>;
}

function keyOf(node: Node): string | null {
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return null;
}

function scopeOf(code: string, file: string): ModuleScope {
  const scope: ModuleScope = { consts: new Map(), imports: new Map(), exports: new Map() };
  const ast = parseTsx(code, file);
  for (const stmt of ast.program.body) {
    if (stmt.type === "ImportDeclaration") {
      if (stmt.importKind === "type") continue;
      for (const spec of stmt.specifiers) {
        if (spec.type !== "ImportSpecifier" || spec.importKind === "type") continue;
        const imported = keyOf(spec.imported);
        if (imported !== null) scope.imports.set(spec.local.name, { specifier: stmt.source.value, imported });
      }
    } else if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        if (decl.id.type === "Identifier" && decl.init != null) scope.consts.set(decl.id.name, decl.init);
      }
    } else if (stmt.type === "ExportNamedDeclaration") {
      if (stmt.declaration?.type === "VariableDeclaration") {
        for (const decl of stmt.declaration.declarations) {
          if (decl.id.type !== "Identifier" || decl.init == null) continue;
          scope.consts.set(decl.id.name, decl.init);
          scope.exports.set(decl.id.name, { expr: decl.init });
        }
      } else if (stmt.declaration == null && stmt.source == null && stmt.exportKind !== "type") {
        for (const spec of stmt.specifiers) {
          if (spec.type !== "ExportSpecifier" || spec.exportKind === "type") continue;
          const exported = keyOf(spec.exported);
          if (exported !== null) scope.exports.set(exported, { local: spec.local.name });
        }
      }
    } else if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration;
      if (decl.type !== "FunctionDeclaration" && decl.type !== "ClassDeclaration" && decl.type !== "TSDeclareFunction") {
        scope.exports.set("default", { expr: decl as Expression });
      }
    }
  }
  // `const X = {…}; export { X }`는 위 순서와 무관하게 consts가 다 모인 뒤 풀린다(resolveExport).
  return scope;
}

interface Env {
  module: string;
  file: string;
  resolveImport: ((specifier: string) => { code: string; file: string } | null) | undefined;
  /** 가져온 모듈의 scope(한 단계만) */
  imported: Map<string, ModuleScope | null>;
  warnings: string[];
  /** 해석 못 한 값의 경고 문구 조각 */
  unresolved: (path: string[]) => void;
}

interface Resolved {
  obj: ObjectExpression;
  scope: ModuleScope;
  /** 다른 모듈에서 가져왔는가 — 거기서는 더 따라가지 않는다 */
  foreign: boolean;
}

function importedScope(env: Env, specifier: string): ModuleScope | null {
  if (env.imported.has(specifier)) return env.imported.get(specifier) ?? null;
  let scope: ModuleScope | null = null;
  if (specifier.startsWith(".") && env.resolveImport !== undefined) {
    const found = env.resolveImport(specifier);
    if (found !== null) {
      try {
        scope = scopeOf(found.code, found.file);
      } catch {
        scope = null;
      }
    }
  }
  env.imported.set(specifier, scope);
  return scope;
}

function exportedExpr(scope: ModuleScope, name: string): Expression | null {
  const entry = scope.exports.get(name);
  if (entry === undefined) return null;
  if ("expr" in entry) return entry.expr;
  return scope.consts.get(entry.local) ?? null;
}

/** 객체 리터럴로 풀리는 식이면 그 객체. 같은 파일 const 식별자와 상대 경로 named import 한 단계까지 따라간다. */
function resolveObject(env: Env, expr: Node, scope: ModuleScope, foreign: boolean, depth = 0): Resolved | null {
  if (depth > MAX_DEPTH) return null;
  const node = unwrap(expr);
  if (node.type === "ObjectExpression") return { obj: node, scope, foreign };
  if (node.type !== "Identifier") return null;
  const local = scope.consts.get(node.name);
  if (local !== undefined) return resolveObject(env, local, scope, foreign, depth + 1);
  const imp = scope.imports.get(node.name);
  if (imp === undefined || foreign) return null;
  const other = importedScope(env, imp.specifier);
  if (other === null) return null;
  const target = exportedExpr(other, imp.imported);
  return target === null ? null : resolveObject(env, target, other, true, depth + 1);
}

/** 모드 객체: 자식이 정확히 `light`·`dark`이고 둘 다 객체 */
function isModeObject(env: Env, obj: ObjectExpression, scope: ModuleScope, foreign: boolean): boolean {
  if (obj.properties.length !== 2) return false;
  const seen = new Set<string>();
  for (const prop of obj.properties) {
    if (prop.type !== "ObjectProperty" || prop.computed) return false;
    const key = keyOf(prop.key);
    if (key !== "light" && key !== "dark") return false;
    if (resolveObject(env, prop.value, scope, foreign) === null) return false;
    seen.add(key);
  }
  return seen.size === 2;
}

function propertyKey(prop: ObjectProperty): string | null {
  if (prop.computed) return null;
  if (prop.key.type === "NumericLiteral") return String(prop.key.value);
  return keyOf(prop.key);
}

function stringValue(node: Node): string | null {
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0 && node.quasis.length === 1) {
    return node.quasis[0]?.value.cooked ?? null;
  }
  return null;
}

function numberValue(node: Node): { px: number; text: string } | null {
  if (node.type === "NumericLiteral") {
    const raw = node.extra?.raw;
    return { px: node.value, text: typeof raw === "string" ? raw : String(node.value) };
  }
  if (node.type === "UnaryExpression" && (node.operator === "-" || node.operator === "+") && node.argument.type === "NumericLiteral") {
    const raw = node.argument.extra?.raw;
    const inner = typeof raw === "string" ? raw : String(node.argument.value);
    return { px: node.operator === "-" ? -node.argument.value : node.argument.value, text: `${node.operator === "-" ? "-" : ""}${inner}` };
  }
  return null;
}

/** 숫자 잎의 카테고리: 잎 키가 fontSize이거나, 가장 가까운 조상(export 이름 포함)이 규칙에 맞는 쪽 */
function lengthCategory(leafKey: string, ancestors: string[]): Token["category"] | null {
  if (leafKey === "fontSize") return "font-size";
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const name = ancestors[i]!;
    if (FONT_SIZE_ANCESTOR.test(name)) return "font-size";
    if (RADIUS_ANCESTOR.test(name)) return "radius";
    if (SPACING_ANCESTOR.test(name)) return "spacing";
  }
  return null;
}

interface WalkState {
  exportName: string;
  tokens: Token[];
  module: string;
}

function walk(
  env: Env,
  state: WalkState,
  obj: ObjectExpression,
  scope: ModuleScope,
  foreign: boolean,
  trail: string[],
  mode: Mode | undefined,
  depth: number,
): void {
  if (depth > MAX_DEPTH) return;
  const modeObject = mode === undefined && isModeObject(env, obj, scope, foreign);
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      const spread = resolveObject(env, prop.argument, scope, foreign);
      if (spread !== null) walk(env, state, spread.obj, spread.scope, spread.foreign, trail, mode, depth + 1);
      else env.unresolved([...trail, "..."]);
      continue;
    }
    if (prop.type !== "ObjectProperty") continue;
    const key = propertyKey(prop);
    if (key === null) {
      env.unresolved([...trail, "[계산 키]"]);
      continue;
    }
    const path = [...trail, key];
    const childMode: Mode | undefined = modeObject && (key === "light" || key === "dark") ? key : mode;
    const value = unwrap(prop.value);

    const text = stringValue(value);
    if (text !== null) {
      const normalized = colorOf(text);
      if (normalized !== null) pushToken(state, path, text, normalized, "color", mode);
      continue;
    }
    const num = numberValue(value);
    if (num !== null) {
      const category = lengthCategory(key, [state.exportName, ...trail]);
      if (category !== null) pushToken(state, path, num.text, { kind: "length", px: num.px }, category, mode);
      continue;
    }
    if (value.type === "ObjectExpression") {
      walk(env, state, value, scope, foreign, path, childMode, depth + 1);
      continue;
    }
    if (value.type === "Identifier") {
      const resolved = resolveObject(env, value, scope, foreign);
      if (resolved !== null) walk(env, state, resolved.obj, resolved.scope, resolved.foreign, path, childMode, depth + 1);
      else env.unresolved(path);
      continue;
    }
    if (
      value.type === "CallExpression" ||
      value.type === "OptionalCallExpression" ||
      value.type === "MemberExpression" ||
      value.type === "OptionalMemberExpression"
    ) {
      env.unresolved(path);
    }
  }
}

function pushToken(
  state: WalkState,
  path: string[],
  value: string,
  normalized: Token["normalized"],
  category: Token["category"],
  mode: Mode | undefined,
): void {
  const js: NonNullable<Token["js"]> = { module: state.module, export: state.exportName, path };
  if (mode !== undefined) js.mode = mode;
  state.tokens.push({ name: [state.exportName, ...path].join("."), value, normalized, category, js });
}

/**
 * 앱이 이미 가진 JS 테마 모듈(`export const colors = { … } as const` 모양)을 정적으로 읽어 토큰으로 만든다.
 * 최상위 `export const X = <객체>`(`as const`·`satisfies` 벗김), `const X = {…}; export { X }`, `export default {…}`(export "default").
 * 잎: 색 문자열 → color, 숫자는 조상 키(export 이름 포함)로 spacing·radius·font-size(잎 키가 `fontSize`여도 font-size).
 * 같은 파일 const 객체와 상대 경로 named import 한 단계까지 따라가고, 그 밖의 값은 건너뛰며 경고한다(토큰을 낸 export에 한해).
 * 파일을 읽지 않는다 — 가져온 모듈은 `resolveImport`가 준다.
 */
export function readJsThemeTokens(
  code: string,
  file: string,
  opts: { module: string; resolveImport?: (specifier: string) => { code: string; file: string } | null },
): JsThemeRead {
  const out: JsThemeRead = { tokens: [], exports: [], warnings: [] };
  let scope: ModuleScope;
  try {
    scope = scopeOf(code, file);
  } catch {
    return out;
  }
  for (const [name] of scope.exports) {
    const expr = exportedExpr(scope, name);
    if (expr === null) continue;
    const warnings: string[] = [];
    const env: Env = {
      module: opts.module,
      file,
      resolveImport: opts.resolveImport,
      imported: new Map(),
      warnings,
      unresolved: (path) => warnings.push(`JS 테마 값을 해석하지 못함: ${[name, ...path].join(".")} (${file})`),
    };
    const root = resolveObject(env, expr, scope, false);
    if (root === null) continue;
    const state: WalkState = { exportName: name, tokens: [], module: opts.module };
    walk(env, state, root.obj, root.scope, root.foreign, [], undefined, 0);
    if (state.tokens.length === 0) continue;
    out.tokens.push(...state.tokens);
    out.exports.push(name);
    out.warnings.push(...warnings);
  }
  return out;
}
