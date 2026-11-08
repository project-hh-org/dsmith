import { importTableOf, memberRefOf, parseTsx, traverse, usagesFromStyleObject } from "@dsmith-dev/core";
import type { StyleObjectContext } from "@dsmith-dev/core";
import { JS_FILES } from "@dsmith-dev/extractor-api";
import type { ExtractContext, Extractor, StyleUsage } from "@dsmith-dev/extractor-api";
import { isExpression } from "@babel/types";
import type { CallExpression, Expression, Node, ObjectExpression } from "@babel/types";
import { classifyRnKey } from "./rn-properties.js";
import { registerPatchTarget, tokenRef, write } from "./write.js";

export const EXTRACTOR_NAME = "react-native-stylesheet";

const STYLE_PROP = /^(?:style|[a-z][A-Za-z]*Style)$/;
const SHEET_METHODS: ReadonlySet<string> = new Set(["create", "compose", "flatten"]);

/** `Obj.method(...)` 호출인지 */
function isCallOf(node: Node, object: string, methods: ReadonlySet<string>): node is CallExpression {
  if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression" || node.callee.computed) return false;
  const { object: obj, property } = node.callee;
  return obj.type === "Identifier" && obj.name === object && property.type === "Identifier" && methods.has(property.name);
}

const isPlatformSelect = (node: Node): node is CallExpression => isCallOf(node, "Platform", new Set(["select"]));
const isSheetCall = (node: Node): node is CallExpression => isCallOf(node, "StyleSheet", SHEET_METHODS);

/** `name(...)` 또는 `X.name(...)` 호출의 함수 이름 */
function calleeName(node: Node): string | undefined {
  if (node.type !== "CallExpression") return undefined;
  const { callee } = node;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier") return callee.property.name;
  return undefined;
}

/** Reanimated 스타일 훅: 첫 인자 콜백이 스타일 객체를 돌려준다 */
const ANIMATED_STYLE_HOOKS: ReadonlySet<string> = new Set(["useAnimatedStyle"]);
/** 속성 값 자리의 애니메이션 호출 → 리터럴이 있는 인자 위치. interpolateColor(값, 입력, 출력[]): 출력 배열의 원소들 */
const ANIMATION_VALUE_CALLS: ReadonlySet<string> = new Set(["withTiming", "withSpring", "interpolateColor"]);

/**
 * 애니메이션 호출 안에서 스타일 값으로 쓰일 식들(`withTiming(40)` → 40, `interpolateColor(p, [0, 1], ["#fff", c])` → "#fff"·c).
 * 다 읽을 수 없으면(인자 없음, 출력 범위가 배열 리터럴이 아님, 스프레드 원소) null — 그때는 호출 전체를 dynamic 한 건으로 둔다.
 */
function animationValues(node: Node): Expression[] | null {
  const name = calleeName(node);
  if (node.type !== "CallExpression" || name === undefined || !ANIMATION_VALUE_CALLS.has(name)) return null;
  // `withTiming(…)` 또는 `Reanimated.withTiming(…)`만 — 다른 객체의 같은 이름 메서드(`theme.withTiming`)는 아니다
  const { callee } = node;
  if (callee.type === "MemberExpression" && !(callee.object.type === "Identifier" && /^(?:Reanimated|Animated)$/.test(callee.object.name))) return null;
  if (name === "withTiming" || name === "withSpring") {
    const first = node.arguments[0];
    return first !== undefined && isExpression(first) ? [first] : null;
  }
  const output = node.arguments[2];
  if (output === undefined || output.type !== "ArrayExpression" || output.elements.length === 0) return null;
  const values: Expression[] = [];
  for (const e of output.elements) {
    if (e === null || !isExpression(e)) return null;
    values.push(e);
  }
  return values;
}

/** `undefined`·`null` — 스타일 값이 아니다(속성을 안 쓰는 가지) */
const isNoValue = (node: Node): boolean =>
  node.type === "NullLiteral" || (node.type === "Identifier" && node.name === "undefined");

/**
 * `pressed ? "#eee" : "#fff"`의 값 가지들(`undefined`·`null` 가지 제외).
 * 가지가 객체·배열(`shadowOffset`·`transform`)이면 어차피 재귀하지 않으므로 null — 호출자는 원래대로 dynamic 한 건으로 둔다.
 */
function conditionalBranches(node: Node): Expression[] | null {
  if (node.type !== "ConditionalExpression") return null;
  const branches = [node.consequent, node.alternate];
  if (branches.some((b) => b.type === "ObjectExpression" || b.type === "ArrayExpression")) return null;
  return branches.filter((b) => !isNoValue(b));
}

/** 함수 본문의 return 식들. 안쪽 함수의 return은 그 함수의 것이라 들어가지 않는다 */
function returnedExpressions(fn: Node): Expression[] {
  if (fn.type !== "ArrowFunctionExpression" && fn.type !== "FunctionExpression") return [];
  if (fn.body.type !== "BlockStatement") return [fn.body];
  const out: Expression[] = [];
  const walk = (node: Node | null | undefined): void => {
    if (node == null) return;
    switch (node.type) {
      case "ReturnStatement":
        if (node.argument != null) out.push(node.argument);
        return;
      case "BlockStatement":
        node.body.forEach(walk);
        return;
      case "IfStatement":
        walk(node.consequent);
        walk(node.alternate);
        return;
      case "TryStatement":
        walk(node.block);
        walk(node.handler?.body);
        walk(node.finalizer);
        return;
      case "SwitchStatement":
        for (const c of node.cases) c.consequent.forEach(walk);
        return;
      case "LabeledStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
        walk(node.body);
        return;
      default:
        return;
    }
  };
  walk(fn.body);
  return out;
}

/** 타입 단언·괄호를 벗긴다. */
function unwrap(node: Expression): Expression {
  let current = node;
  while (
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "ParenthesizedExpression"
  ) {
    current = current.expression;
  }
  return current;
}

function extract(ctx: ExtractContext): StyleUsage[] {
  // 복구 불가능한 문법 오류는 그대로 던진다. 파일 단위 실패 기록은 호출자(indexer) 몫이다.
  const ast = parseTsx(ctx.code, ctx.file);
  const imports = importTableOf(ast);
  const usages: StyleUsage[] = [];
  /** 이미 읽은 노드(JSX prop 안의 `StyleSheet.flatten(...)`을 순회가 다시 만나도 두 번 세지 않는다) */
  const handled = new Set<Node>();

  const baseCtx = { file: ctx.file, code: ctx.code, extractor: EXTRACTOR_NAME };

  /** 다른 곳에 정의된 스타일을 가리키는 값(`styles.box`)을 dynamic other 한 건으로 센다. */
  function reference(node: Node): void {
    const { start, end, loc } = node;
    if (start == null || end == null || loc == null) return;
    usages.push({
      file: ctx.file,
      line: loc.start.line,
      column: loc.start.column,
      property: "other",
      raw: ctx.code.slice(start, end),
      normalized: { kind: "unknown" },
      source: "dynamic",
      extractor: EXTRACTOR_NAME,
    });
  }

  /** `...typography.caption`: import에서 시작하는 멤버 식이면 ref.spread를 단 other dynamic 한 건. 그 밖의 스프레드는 무시. */
  function spread(argument: Expression): void {
    const arg = unwrap(argument);
    if (isPlatformSelect(arg)) {
      selectCall(arg, undefined);
      return;
    }
    if (arg.type !== "MemberExpression" && arg.type !== "OptionalMemberExpression") return;
    reference(arg);
    const usage = usages[usages.length - 1];
    if (usage === undefined) return;
    const ref = memberRefOf(usage.raw, imports);
    if (ref !== undefined) usage.ref = { ...ref, spread: true };
  }

  /** `Platform.select({ ios: …, android: … })`의 값들. key가 있으면 속성 값 위치라 그 키로 분류한다. */
  function selectCall(call: CallExpression, key: string | undefined): void {
    const first = call.arguments[0];
    if (first === undefined || first.type !== "ObjectExpression") return;
    for (const prop of first.properties) {
      if (prop.type !== "ObjectProperty") continue;
      const value = prop.value;
      if (value.type === "ObjectExpression") {
        addObject(value);
      } else if (key === undefined) {
        if (isExpression(value)) visit(value);
      } else if (isExpression(value)) {
        keyedValue(key, value);
      }
    }
  }

  /** 속성 값 자리의 식을 바깥 키 하나짜리 객체인 것처럼 같은 규칙으로 분류한다(구간은 값 노드 그대로). */
  function keyedValue(key: string, value: Expression): void {
    const synthetic = {
      type: "ObjectExpression",
      properties: [{ type: "ObjectProperty", key: { type: "Identifier", name: key }, computed: false, shorthand: false, value }],
    } as unknown as ObjectExpression;
    addObject(synthetic);
  }

  const classify: NonNullable<StyleObjectContext["classify"]> = (key, value, defaultClassify) => {
    // Platform.select·애니메이션 호출 값은 아래에서 따로 읽는다
    if (isPlatformSelect(value) || animationValues(value) !== null || conditionalBranches(value) !== null) return null;
    const mapped = classifyRnKey(key);
    if (mapped === undefined || mapped === "other") return undefined;
    return defaultClassify(mapped);
  };

  /** 스타일 객체 리터럴 하나: 스프레드, 속성 값, 속성 값 자리의 Platform.select. */
  function addObject(obj: ObjectExpression): void {
    for (const prop of obj.properties) {
      if (prop.type === "SpreadElement") spread(prop.argument);
    }
    for (const { usage, patch } of usagesFromStyleObject(obj, { ...baseCtx, classify })) {
      if (patch !== null) registerPatchTarget(usage, { ...patch, file: ctx.file });
      if (usage.source === "dynamic") {
        // `color: colors.surface`처럼 import 바인딩에서 시작하는 멤버 식은 core가 토큰 사용으로 해석할 수 있게 ref를 붙인다.
        const ref = memberRefOf(usage.raw, imports);
        if (ref !== undefined) usage.ref = ref;
      }
      usages.push(usage);
    }
    for (const prop of obj.properties) {
      if (prop.type !== "ObjectProperty" || prop.computed) continue;
      const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "StringLiteral" ? prop.key.value : null;
      if (key === null) continue;
      if (isPlatformSelect(prop.value)) {
        selectCall(prop.value, key);
        continue;
      }
      // `backgroundColor: pressed ? "#eee" : "#fff"` — 조건은 스타일이 아니고 가지들이 그 키의 값이다. 애니메이션 호출은 목표값·출력 범위가 값이다
      const values = animationValues(prop.value) ?? conditionalBranches(prop.value);
      if (values !== null) for (const v of values) keyedValue(key, v);
    }
  }

  /** `style`·`*Style` 값 / `StyleSheet.create` 클래스 값: 객체, 배열, 조건식 가지, 호출, 참조. */
  function visit(node: Expression): void {
    const expr = unwrap(node);
    if (handled.has(expr)) return;
    handled.add(expr);
    switch (expr.type) {
      case "ObjectExpression":
        addObject(expr);
        return;
      case "ArrayExpression":
        for (const element of expr.elements) {
          if (element !== null && element.type !== "SpreadElement") visit(element);
        }
        return;
      case "LogicalExpression":
        // `cond && {…}`의 조건은 스타일이 아니다. `a || b`·`a ?? b`는 양쪽이 스타일일 수 있다.
        if (expr.operator !== "&&") visit(expr.left);
        visit(expr.right);
        return;
      case "ConditionalExpression":
        visit(expr.consequent);
        visit(expr.alternate);
        return;
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        // Pressable `style={({ pressed }) => …}` · useAnimatedStyle 콜백: 반환 식이 스타일이다
        for (const e of returnedExpressions(expr)) visit(e);
        return;
      case "CallExpression":
        if (isPlatformSelect(expr)) {
          selectCall(expr, undefined);
        } else if (isSheetCall(expr)) {
          sheetCall(expr);
        } else {
          reference(expr);
        }
        return;
      case "Identifier":
        if (expr.name !== "undefined") reference(expr);
        return;
      case "MemberExpression":
      case "OptionalMemberExpression":
      case "OptionalCallExpression":
        reference(expr);
        return;
      default:
        return;
    }
  }

  function sheetCall(call: CallExpression): void {
    const method = call.callee.type === "MemberExpression" && call.callee.property.type === "Identifier" ? call.callee.property.name : "";
    if (method === "create") {
      const first = call.arguments[0];
      if (first === undefined || first.type !== "ObjectExpression") return;
      for (const prop of first.properties) {
        if (prop.type === "ObjectProperty" && isExpression(prop.value)) visit(prop.value);
      }
      return;
    }
    for (const arg of call.arguments) {
      if (isExpression(arg)) visit(arg);
    }
  }

  traverse(ast, {
    CallExpression(path) {
      // 타입 가드(isSheetCall)의 false 가지에서 CallExpression이 never로 좁혀지지 않게 먼저 꺼내 둔다
      const hook = calleeName(path.node);
      const callback = path.node.arguments[0];
      if (isSheetCall(path.node)) {
        visit(path.node);
        return;
      }
      if (hook !== undefined && ANIMATED_STYLE_HOOKS.has(hook) && callback !== undefined && isExpression(callback)) visit(callback);
    },
    JSXAttribute(path) {
      const { name, value } = path.node;
      if (name.type !== "JSXIdentifier" || !STYLE_PROP.test(name.name)) return;
      if (value?.type !== "JSXExpressionContainer" || value.expression.type === "JSXEmptyExpression") return;
      visit(value.expression);
    },
  });

  return usages.sort((a, b) => a.line - b.line || a.column - b.column);
}

export const reactNativeExtractor: Extractor = {
  name: EXTRACTOR_NAME,
  files: JS_FILES,
  parses: "tsx",
  signals: { dependencies: ["react-native"], code: "StyleSheet\\.create\\(" },
  appliesTo: (ctx) =>
    /\.[cm]?[jt]sx?$/.test(ctx.file) && /\b(?:style|[A-Za-z]+Style)=\{|StyleSheet\.|\buseAnimatedStyle\(/.test(ctx.code),
  extract,
  write,
  tokenRef,
};
