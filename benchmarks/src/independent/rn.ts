import { parse } from "@babel/parser";
import { childNodes, isNode, nameOf, unwrap, type AstNode } from "./ast.js";
import { isColorProperty, isNumericLengthProperty, scanColors } from "./colors.js";
import { resolveLocal, type ResolverConfig } from "./resolve.js";
import type { Occurrence } from "./types.js";

/**
 * React Native 파일의 스타일 문맥에서 독립 채점기가 세는 등장을 모은다. dsmith 코드를 쓰지 않는다(isolation 테스트가 강제).
 *
 * 스타일 문맥 = `StyleSheet.create|compose|flatten` 인자, JSX `style`·`*Style` 속성 값 — 객체·배열·조건(`c ? a : b`)·논리(`c && a`)·
 * 함수 본문(Pressable의 `style={({ pressed }) => …}`)과 그 안의 스프레드·`Platform.select` 값까지.
 * 세는 것: (a) 색 문자열, (b) RN 길이 키의 숫자(0 제외), (f) themeRef.
 * themeRef = 로컬 모듈(상대 경로·tsconfig paths 별칭)에서 import한 바인딩으로 시작하는 멤버 식(`colors.surface`, `theme.space[2]`, `colors[variant]`)이나 스프레드(`...typography.caption`)이고,
 * 그 모듈 파일이 객체 리터럴 export를 가질 때만. 판정은 스냅샷을 쓰지 않는다 — 파일 내용만 본다(`isThemeModule`을 호출자가 준다).
 * `style={styles.card}`처럼 같은 파일의 StyleSheet를 가리키는 참조는 세지 않는다(정의 쪽 값을 센다).
 */

export interface RnScanContext {
  /** root 상대 POSIX */
  file: string;
  resolver: ResolverConfig;
  /** root 상대 모듈 경로(확장자·index 없음) → 그 파일이 객체 리터럴 export를 갖는가 */
  isThemeModule: (moduleKey: string) => boolean;
}

/** 웹 목록(colors.ts)에 RN에서 쓰는 길이 키를 더한다: paddingHorizontal 등과 Start/End 모서리 */
const RN_EXTRA_LENGTH = /^(?:padding|margin)(?:Horizontal|Vertical)$|^border(?:Top|Bottom)(?:Start|End)Radius$|^border(?:Start|End)(?:Start|End)Radius$/;

export function isRnLengthProperty(prop: string): boolean {
  return isNumericLengthProperty(prop) || RN_EXTRA_LENGTH.test(prop);
}

const camel = (s: string): string => s.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

function parseScript(code: string, file: string): AstNode {
  const isTs = /\.[cm]?tsx?$/.test(file);
  const isTsx = /\.tsx$/.test(file);
  const plugins: ("jsx" | "typescript")[] = isTs ? (isTsx ? ["typescript", "jsx"] : ["typescript"]) : ["jsx"];
  return parse(code, { sourceType: "module", plugins, allowReturnOutsideFunction: true, errorRecovery: false }) as unknown as AstNode;
}

function isObjectInit(node: unknown): boolean {
  return unwrap(node)?.type === "ObjectExpression";
}

/**
 * 파일이 객체 리터럴을 export하는가: `export const X = {…}`(as const·satisfies 포함), `const X = {…}; export { X }`, `export default {…}`·`export default X`.
 * 파싱이 던지면 false.
 */
export function hasObjectLiteralExport(code: string, file: string): boolean {
  let root: AstNode;
  try {
    root = parseScript(code, file);
  } catch {
    return false;
  }
  const program = isNode(root.program) ? root.program : null;
  if (program === null || !Array.isArray(program.body)) return false;
  const localObjects = new Set<string>();
  for (const stmt of program.body) {
    const decl = isNode(stmt) && stmt.type === "VariableDeclaration" ? stmt : isNode(stmt) && stmt.type === "ExportNamedDeclaration" && isNode(stmt.declaration) && stmt.declaration.type === "VariableDeclaration" ? stmt.declaration : null;
    if (decl === null || !Array.isArray(decl.declarations)) continue;
    for (const d of decl.declarations) {
      const id = isNode(d) ? nameOf(d.id) : null;
      if (id !== null && isNode(d) && isObjectInit(d.init)) localObjects.add(id);
    }
  }
  for (const stmt of program.body) {
    if (!isNode(stmt)) continue;
    if (stmt.type === "ExportNamedDeclaration") {
      const decl = isNode(stmt.declaration) ? stmt.declaration : null;
      if (decl !== null && decl.type === "VariableDeclaration" && Array.isArray(decl.declarations)) {
        for (const d of decl.declarations) if (isNode(d) && isObjectInit(d.init)) return true;
      }
      if (stmt.source === null || stmt.source === undefined) {
        if (Array.isArray(stmt.specifiers)) {
          for (const s of stmt.specifiers) {
            const local = isNode(s) ? nameOf(s.local) : null;
            if (local !== null && localObjects.has(local)) return true;
          }
        }
      }
    } else if (stmt.type === "ExportDefaultDeclaration") {
      const d = unwrap(stmt.declaration);
      if (d !== null && (d.type === "ObjectExpression" || (d.type === "Identifier" && typeof d.name === "string" && localObjects.has(d.name)))) return true;
    }
  }
  return false;
}

const MEMBER = new Set(["MemberExpression", "OptionalMemberExpression"]);

/** 식을 `a.b[0]` 모양의 문자열로(계산 접근이 리터럴이 아니면 `[]`). 채점 키로만 쓴다 */
function renderMember(node: AstNode): string {
  const n = unwrap(node);
  if (n === null) return "";
  if (n.type === "Identifier") return typeof n.name === "string" ? n.name : "";
  if (MEMBER.has(n.type)) {
    const obj = isNode(n.object) ? renderMember(n.object) : "";
    const prop = isNode(n.property) ? n.property : null;
    if (n.computed === true) {
      const lit = prop !== null && (prop.type === "NumericLiteral" || prop.type === "StringLiteral") ? String(prop.value) : "";
      return `${obj}[${lit}]`;
    }
    return `${obj}.${prop === null ? "" : (nameOf(prop) ?? "")}`;
  }
  return "";
}

/** 멤버 체인의 뿌리 식별자와 멤버 접근 여부. 뿌리가 식별자가 아니면 null */
function rootOf(node: unknown): { name: string; member: boolean } | null {
  let cur = unwrap(node);
  let member = false;
  for (let guard = 0; guard < 30 && cur !== null; guard += 1) {
    if (cur.type === "Identifier") return typeof cur.name === "string" ? { name: cur.name, member } : null;
    if (MEMBER.has(cur.type)) {
      member = true;
      cur = unwrap(cur.object);
    } else return null;
  }
  return null;
}

function calleeIs(callee: unknown, object: string, methods: readonly string[]): boolean {
  const c = unwrap(callee);
  if (c === null || !MEMBER.has(c.type) || c.computed === true) return false;
  const obj = isNode(c.object) && c.object.type === "Identifier" ? c.object.name : null;
  const prop = nameOf(c.property);
  return obj === object && prop !== null && methods.includes(prop);
}

const SHEET_METHODS = ["create", "compose", "flatten"] as const;
const isStyleSheetCall = (n: AstNode): boolean => n.type === "CallExpression" && calleeIs(n.callee, "StyleSheet", SHEET_METHODS);
const isPlatformSelect = (n: AstNode): boolean => n.type === "CallExpression" && calleeIs(n.callee, "Platform", ["select"]);
const STYLE_ATTR = /^(?:style|[a-z][A-Za-z]*Style)$/;

/** 함수 본문이 돌려주는 식들(중첩 함수는 보지 않는다) */
function returnedExpressions(fn: AstNode): AstNode[] {
  const body = isNode(fn.body) ? fn.body : null;
  if (body === null) return [];
  if (body.type !== "BlockStatement") return [body];
  const out: AstNode[] = [];
  const visit = (n: AstNode): void => {
    if (n.type === "ArrowFunctionExpression" || n.type === "FunctionExpression" || n.type === "FunctionDeclaration") return;
    if (n.type === "ReturnStatement") {
      if (isNode(n.argument)) out.push(n.argument);
      return;
    }
    for (const c of childNodes(n)) visit(c);
  };
  for (const c of childNodes(body)) visit(c);
  return out;
}

/** root: Program을 감싼 File 노드, imports: 로컬 이름 → import 지정자(scan.ts의 1차 수집) */
export function scanRnStyles(root: AstNode, imports: ReadonlyMap<string, string>, ctx: RnScanContext): Occurrence[] {
  const out: Occurrence[] = [];
  const themeBinding = new Map<string, boolean>();
  const isThemeBinding = (name: string): boolean => {
    const cached = themeBinding.get(name);
    if (cached !== undefined) return cached;
    const source = imports.get(name);
    const key = source === undefined ? null : resolveLocal(ctx.file, source, ctx.resolver);
    const result = key !== null && ctx.isThemeModule(key);
    themeBinding.set(name, result);
    return result;
  };
  const themeRef = (node: unknown, allowBare: boolean): boolean => {
    const r = rootOf(node);
    if (r === null || (!r.member && !allowBare) || !isThemeBinding(r.name)) return false;
    const n = unwrap(node);
    out.push({ kind: "themeRef", value: n === null ? r.name : renderMember(n) });
    return true;
  };

  const walkSpread = (arg: unknown): void => {
    if (themeRef(arg, true)) return;
    walk(arg, null);
  };

  const walk = (node: unknown, prop: string | null): void => {
    const n = unwrap(node);
    if (n === null) return;
    switch (n.type) {
      case "ObjectExpression": {
        if (!Array.isArray(n.properties)) return;
        for (const p of n.properties) {
          if (!isNode(p)) continue;
          if (p.type === "SpreadElement") walkSpread(p.argument);
          else if (p.type === "ObjectProperty") walk(p.value, p.computed === true ? null : (nameOf(p.key) === null ? null : camel(nameOf(p.key) ?? "")));
        }
        return;
      }
      case "ArrayExpression": {
        if (!Array.isArray(n.elements)) return;
        for (const e of n.elements) {
          if (!isNode(e)) continue;
          if (e.type === "SpreadElement") walkSpread(e.argument);
          else walk(e, prop);
        }
        return;
      }
      case "ConditionalExpression":
        walk(n.consequent, prop);
        walk(n.alternate, prop);
        return;
      case "LogicalExpression":
        // `cond && {…}`의 왼쪽은 조건이다. `a || b`·`a ?? b`는 양쪽이 값이다
        if (n.operator !== "&&") walk(n.left, prop);
        walk(n.right, prop);
        return;
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        for (const r of returnedExpressions(n)) walk(r, prop);
        return;
      case "CallExpression": {
        if (isPlatformSelect(n)) {
          const arg = Array.isArray(n.arguments) ? unwrap(n.arguments[0]) : null;
          if (arg !== null && arg.type === "ObjectExpression" && Array.isArray(arg.properties)) {
            for (const p of arg.properties) if (isNode(p) && p.type === "ObjectProperty") walk(p.value, prop);
          }
        } else if (isStyleSheetCall(n) && Array.isArray(n.arguments)) {
          for (const a of n.arguments) walk(a, null);
        }
        return;
      }
      case "StringLiteral":
        if (typeof n.value === "string") for (const c of scanColors(n.value, { named: prop !== null && isColorProperty(prop) })) out.push({ kind: "color", value: c });
        return;
      case "TemplateLiteral": {
        if (Array.isArray(n.quasis)) {
          for (const q of n.quasis) {
            const v = isNode(q) && typeof q.value === "object" && q.value !== null ? (q.value as { cooked?: unknown; raw?: unknown }) : null;
            const text = v === null ? "" : typeof v.cooked === "string" ? v.cooked : typeof v.raw === "string" ? v.raw : "";
            for (const c of scanColors(text, { named: prop !== null && isColorProperty(prop) })) out.push({ kind: "color", value: c });
          }
        }
        if (Array.isArray(n.expressions)) for (const e of n.expressions) walk(e, null);
        return;
      }
      case "NumericLiteral":
        if (prop !== null && isRnLengthProperty(prop) && typeof n.value === "number" && n.value !== 0) out.push({ kind: "length", value: `${n.value}dp` });
        return;
      case "UnaryExpression": {
        const arg = unwrap(n.argument);
        if (arg !== null && arg.type === "NumericLiteral" && typeof arg.value === "number") {
          if (n.operator === "-" && prop !== null && isRnLengthProperty(prop) && arg.value !== 0) out.push({ kind: "length", value: `-${arg.value}dp` });
          else if (n.operator === "+" && prop !== null && isRnLengthProperty(prop) && arg.value !== 0) out.push({ kind: "length", value: `${arg.value}dp` });
        } else walk(arg, prop);
        return;
      }
      case "BinaryExpression":
        // `spacing.md * 2`의 2는 길이 리터럴이 아니다 — 피연산자 안의 테마 참조만 본다
        walk(n.left, null);
        walk(n.right, null);
        return;
      case "MemberExpression":
      case "OptionalMemberExpression":
        themeRef(n, false);
        return;
      default:
        return;
    }
  };

  const find = (node: AstNode): void => {
    if (node.type === "ImportDeclaration") return;
    if (node.type === "JSXAttribute") {
      const n = nameOf(node.name);
      if (n !== null && STYLE_ATTR.test(n) && isNode(node.value) && node.value.type === "JSXExpressionContainer") {
        walk(node.value.expression, null);
        return;
      }
    } else if (isStyleSheetCall(node) && Array.isArray(node.arguments)) {
      for (const a of node.arguments) walk(a, null);
      return;
    }
    for (const c of childNodes(node)) find(c);
  };
  find(root);
  return out;
}
