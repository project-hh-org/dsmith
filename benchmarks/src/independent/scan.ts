import { parse } from "@babel/parser";
import { childNodes, isNode, nameOf, type AstNode } from "./ast.js";
import { scanRnStyles, type RnScanContext } from "./rn.js";
import { isColorProperty, isNumericLengthProperty, scanColors, scanLengths, scanVarRefs } from "./colors.js";
import { resolveLocal, isDsModule, type ResolverConfig } from "./resolve.js";
import { arbitraryValue, classTokens, isColorPrefix, normalizeUtility, paletteKind, splitVariants, themeVarOf } from "./tailwind.js";
import type { Occurrence } from "./types.js";

/**
 * 스크립트(.ts/.tsx/.js/.jsx) 한 파일에서 독립 채점기가 세는 등장(occurrence)을 모은다.
 *
 * "어디의 문자열을 보는가"가 정밀도를 정한다 — 아무 문자열이나 훑으면 사용자 문구("Order #123", "p-4 사이즈")가 걸린다. 그래서 문맥을 둔다:
 *   - 클래스 문맥: JSX `className`/`class` 속성 값 전체, clsx·cn·cx·classnames·classNames·twMerge·twJoin·cva·tv 호출 인자,
 *     `tw` 태그드 템플릿, 그리고 className/class 속성 식에 식별자로 쓰인 변수(또는 이름이 class·cls를 포함하는 변수)의 초기값.
 *     여기서는 공백으로 나눈 토큰을 Tailwind 규칙(tailwind.ts)으로 본다.
 *   - 스타일 문맥: JSX `style`·`sx` 속성 값 전체, style 식에 쓰인 변수(또는 이름이 style·css·sx를 포함하는 변수)의 초기값, `css(...)` 호출 인자.
 *     객체 속성 키를 속성 이름으로 삼아 문자열(색·길이·var)과 숫자(px로 해석되는 길이 속성)를 본다.
 *   - CSS 태그드 템플릿: styled.x`…`, styled(X)`…`, css`…`, keyframes`…`, createGlobalStyle`…`, injectGlobal`…` — `속성: 값;` 조각으로 본다.
 *   - SVG 색 속성: JSX fill·stroke·stopColor·floodColor·lightingColor·color 속성의 문자열 값.
 * 그 밖의 문자열(텍스트·URL 등)은 보지 않는다.
 */

const CLASS_HELPERS = new Set(["clsx", "cn", "cx", "classnames", "classNames", "twMerge", "twJoin", "cva", "tv"]);
const CSS_TAGS = new Set(["styled", "css", "keyframes", "createGlobalStyle", "injectGlobal"]);
const SVG_COLOR_ATTRS = new Set(["fill", "stroke", "stopColor", "floodColor", "lightingColor", "color"]);

export interface ScriptScanContext {
  /** root 상대 POSIX */
  file: string;
  resolver: ResolverConfig;
  dsModules: readonly string[];
  /** 프리셋·설정의 `키 → --var 이름` */
  themeVars: ReadonlyMap<string, string>;
  /** root 상대 모듈 경로(확장자·index 없음)의 파일이 객체 리터럴 export를 갖는가. RN 파일의 themeRef 판정에 쓴다. 없으면 어떤 모듈도 테마가 아니다 */
  isThemeModule?: (moduleKey: string) => boolean;
}

interface Cx {
  cls: boolean;
  style: boolean;
  /** 스타일 문맥의 가장 가까운 객체 속성 이름(camelCase) */
  prop: string | null;
}
const PLAIN: Cx = { cls: false, style: false, prop: null };

/** TemplateElement의 문자열(cooked, 없으면 raw). `value`는 노드가 아니라 {raw, cooked} 객체다 */
function templateText(q: unknown): string {
  if (!isNode(q) || typeof q.value !== "object" || q.value === null) return "";
  const v = q.value as { cooked?: unknown; raw?: unknown };
  return typeof v.cooked === "string" ? v.cooked : typeof v.raw === "string" ? v.raw : "";
}

const camel = (s: string): string => s.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

/** 호출/태그의 루트 식별자: `styled.div.attrs(...)` → styled, `styled(Button)` → styled, `a.b.c` → a */
function rootName(node: unknown): string | null {
  let cur: unknown = node;
  for (let guard = 0; guard < 20 && isNode(cur); guard += 1) {
    if (cur.type === "Identifier") return typeof cur.name === "string" ? cur.name : null;
    if (cur.type === "MemberExpression") cur = cur.object;
    else if (cur.type === "CallExpression") cur = cur.callee;
    else if (cur.type === "TaggedTemplateExpression") cur = cur.tag;
    else return null;
  }
  return null;
}

/** 호출의 "마지막 이름": `cva(...)` → cva, `utils.cn(...)` → cn */
function calleeName(callee: unknown): string | null {
  if (!isNode(callee)) return null;
  if (callee.type === "Identifier") return typeof callee.name === "string" ? callee.name : null;
  if (callee.type === "MemberExpression" && !callee.computed) return nameOf(callee.property);
  return null;
}

/** 선언(속성: 값) 하나에서 색·길이·var을 센다. `--custom` 선언은 var 참조만 센다(값은 토큰 정의라서) */
export function declarationOccurrences(prop: string, value: string): Occurrence[] {
  const out: Occurrence[] = [];
  const custom = prop.startsWith("--");
  if (!custom) {
    for (const c of scanColors(value, { named: isColorProperty(prop) })) out.push({ kind: "color", value: c });
    for (const l of scanLengths(value)) out.push({ kind: "length", value: l });
  }
  for (const v of scanVarRefs(value)) out.push({ kind: "var", value: v });
  return out;
}

/** CSS 텍스트(태그드 템플릿 본문)를 `속성: 값` 조각으로 쪼개 센다 */
export function cssTextOccurrences(text: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (const segment of text.replace(/\/\*[\s\S]*?\*\//g, "").split(/[;{}]/)) {
    const colon = segment.indexOf(":");
    if (colon === -1) continue;
    const prop = segment.slice(0, colon).trim();
    const value = segment.slice(colon + 1).trim();
    if (!/^-{0,2}[A-Za-z][\w-]*$/.test(prop) || value === "") continue;
    out.push(...declarationOccurrences(prop, value));
  }
  return out;
}

/** 클래스 문자열 하나를 토큰으로 나눠 센다 */
export function classStringOccurrences(text: string, themeVars: ReadonlyMap<string, string>): Occurrence[] {
  const out: Occurrence[] = [];
  for (const token of classTokens(text)) {
    const { utility } = splitVariants(token);
    const u = normalizeUtility(utility);
    if (u === "") continue;
    const arb = arbitraryValue(u);
    if (arb !== null) {
      const inner = arb.inner.replace(/_/g, " ");
      const colorTyped = /^color:/.test(inner);
      for (const c of scanColors(inner, { named: isColorPrefix(arb.prefix) || colorTyped })) out.push({ kind: "color", value: c });
      for (const l of scanLengths(inner)) out.push({ kind: "length", value: l });
      for (const v of scanVarRefs(inner)) out.push({ kind: "var", value: v });
      continue;
    }
    const kind = paletteKind(u);
    if (kind !== null) {
      out.push({ kind: "palette", value: u });
      continue;
    }
    const themed = themeVarOf(u, themeVars);
    if (themed !== null) out.push({ kind: "var", value: themed });
  }
  return out;
}

function parseScript(code: string, file: string): AstNode {
  const isTs = /\.[cm]?tsx?$/.test(file);
  const isTsx = /\.tsx$/.test(file);
  const plugins: ("jsx" | "typescript")[] = isTs ? (isTsx ? ["typescript", "jsx"] : ["typescript"]) : ["jsx"];
  const ast = parse(code, { sourceType: "module", plugins, allowReturnOutsideFunction: true, errorRecovery: false });
  return ast as unknown as AstNode;
}

/** 파싱이 던지면 호출자가 parseFailed로 처리한다 */
export function scanScript(code: string, ctx: ScriptScanContext): Occurrence[] {
  const root = parseScript(code, ctx.file);

  // 1차: import 이름 → 지정자, className/style 속성 식에 쓰인 식별자
  const imports = new Map<string, string>();
  const classIdents = new Set<string>();
  const styleIdents = new Set<string>();
  const collectIdents = (node: AstNode, into: Set<string>): void => {
    if (node.type === "Identifier" && typeof node.name === "string") into.add(node.name);
    for (const c of childNodes(node)) collectIdents(c, into);
  };
  const pass1 = (node: AstNode): void => {
    if (node.type === "ImportDeclaration") {
      const source = isNode(node.source) && typeof node.source.value === "string" ? node.source.value : null;
      if (source !== null && Array.isArray(node.specifiers)) {
        for (const s of node.specifiers) {
          const local = isNode(s) && isNode(s.local) && typeof s.local.name === "string" ? s.local.name : null;
          if (local !== null) imports.set(local, source);
        }
      }
      return;
    }
    if (node.type === "JSXAttribute" && isNode(node.value)) {
      const n = nameOf(node.name);
      if (n === "className" || n === "class") collectIdents(node.value, classIdents);
      else if (n === "style" || n === "sx") collectIdents(node.value, styleIdents);
    }
    for (const c of childNodes(node)) pass1(c);
  };
  pass1(root);
  // react-native에서 import하는 파일의 스타일은 RN 스캐너(rn.ts)가 센다. 이 스캐너는 클래스·컴포넌트 등장만 센다
  const rn = [...imports.values()].includes("react-native");

  const out: Occurrence[] = [];
  const push = (os: Occurrence[]): void => {
    for (const o of os) out.push(o);
  };

  const scanString = (text: string, cx: Cx): void => {
    if (cx.cls) push(classStringOccurrences(text, ctx.themeVars));
    else if (cx.style) push(declarationOccurrences(cx.prop ?? "", text));
  };

  const componentOf = (name: unknown): Occurrence | null => {
    if (!isNode(name)) return null;
    let cur: AstNode = name;
    while (cur.type === "JSXMemberExpression" && isNode(cur.object)) cur = cur.object;
    if (cur.type !== "JSXIdentifier" || typeof cur.name !== "string" || !/^[A-Z]/.test(cur.name)) return null;
    const source = imports.get(cur.name);
    if (source === undefined) return null;
    const resolved = resolveLocal(ctx.file, source, ctx.resolver);
    if (resolved === null) return null;
    return { kind: isDsModule(resolved, ctx.dsModules) ? "dsComp" : "localComp", value: `${cur.name}|${resolved}` };
  };

  const visit = (node: AstNode, cx: Cx): void => {
    switch (node.type) {
      case "ImportDeclaration":
      case "ExportAllDeclaration":
        return;
      case "JSXOpeningElement": {
        const comp = componentOf(node.name);
        if (comp !== null) out.push(comp);
        if (Array.isArray(node.attributes)) for (const a of node.attributes) if (isNode(a)) visit(a, PLAIN);
        return;
      }
      case "JSXAttribute": {
        const n = nameOf(node.name);
        const value = isNode(node.value) ? node.value : null;
        if (value === null) return;
        if (n === "className" || n === "class") visit(value, { cls: true, style: false, prop: null });
        else if (n === "style" || n === "sx") {
          if (!rn) visit(value, { cls: false, style: true, prop: null });
        }
        else if (n !== null && SVG_COLOR_ATTRS.has(n) && value.type === "StringLiteral" && typeof value.value === "string") {
          for (const c of scanColors(value.value, { named: true })) out.push({ kind: "color", value: c });
        } else visit(value, PLAIN);
        return;
      }
      case "VariableDeclarator": {
        const id = nameOf(node.id);
        if (isNode(node.init)) {
          const cls = cx.cls || (id !== null && (classIdents.has(id) || /class|cls/i.test(id)));
          const style = !rn && (cx.style || (id !== null && (styleIdents.has(id) || /style|css|^sx$/i.test(id))));
          visit(node.init, { cls, style: style && !cls, prop: null });
        }
        return;
      }
      case "ObjectProperty": {
        const key = node.computed === true ? null : nameOf(node.key);
        // clsx({ "bg-blue-500": active }) — 클래스 문맥에서는 키가 클래스 문자열이다
        if (cx.cls && isNode(node.key) && node.key.type === "StringLiteral" && typeof node.key.value === "string") scanString(node.key.value, cx);
        if (isNode(node.value)) visit(node.value, cx.style && key !== null ? { ...cx, prop: camel(key) } : cx);
        return;
      }
      case "CallExpression": {
        const name = calleeName(node.callee);
        if (isNode(node.callee)) visit(node.callee, cx);
        const next: Cx = name !== null && CLASS_HELPERS.has(name) ? { cls: true, style: false, prop: null } : name === "css" && !rn ? { cls: false, style: true, prop: null } : cx;
        if (Array.isArray(node.arguments)) for (const a of node.arguments) if (isNode(a)) visit(a, next);
        return;
      }
      case "TaggedTemplateExpression": {
        const root2 = rootName(node.tag);
        const quasi = isNode(node.quasi) ? node.quasi : null;
        if (quasi !== null && Array.isArray(quasi.quasis)) {
          const parts = quasi.quasis.map(templateText);
          if (root2 !== null && CSS_TAGS.has(root2)) push(cssTextOccurrences(parts.join("__X__")));
          else if (root2 === "tw") for (const p of parts) push(classStringOccurrences(p, ctx.themeVars));
          if (Array.isArray(quasi.expressions)) for (const e of quasi.expressions) if (isNode(e)) visit(e, cx);
        }
        if (isNode(node.tag)) visit(node.tag, cx);
        return;
      }
      case "StringLiteral":
        if (typeof node.value === "string") scanString(node.value, cx);
        return;
      case "TemplateLiteral": {
        if (Array.isArray(node.quasis)) {
          for (const q of node.quasis) scanString(templateText(q), cx);
        }
        if (Array.isArray(node.expressions)) for (const e of node.expressions) if (isNode(e)) visit(e, cx);
        return;
      }
      case "NumericLiteral":
        if (cx.style && cx.prop !== null && isNumericLengthProperty(cx.prop) && typeof node.value === "number" && node.value !== 0) {
          out.push({ kind: "length", value: `${node.value}px` });
        }
        return;
      default:
        for (const c of childNodes(node)) visit(c, cx);
    }
  };
  visit(root, PLAIN);
  if (rn) {
    const rnCtx: RnScanContext = { file: ctx.file, resolver: ctx.resolver, isThemeModule: ctx.isThemeModule ?? (() => false) };
    for (const o of scanRnStyles(root, imports, rnCtx)) out.push(o);
  }
  return out;
}
