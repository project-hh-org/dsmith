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
      } else {
        // 속성 값 자리의 리터럴은 바깥 키 하나짜리 객체인 것처럼 같은 규칙으로 분류한다(구간은 값 노드 그대로).
        const synthetic = {
          type: "ObjectExpression",
          properties: [{ type: "ObjectProperty", key: { type: "Identifier", name: key }, computed: false, shorthand: false, value }],
        } as unknown as ObjectExpression;
        addObject(synthetic);
      }
    }
  }

  const classify: NonNullable<StyleObjectContext["classify"]> = (key, value, defaultClassify) => {
    // Platform.select 값은 아래에서 따로 읽는다
    if (isPlatformSelect(value)) return null;
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
      if (!isPlatformSelect(prop.value)) continue;
      const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "StringLiteral" ? prop.key.value : null;
      if (key !== null) selectCall(prop.value, key);
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
      if (isSheetCall(path.node)) visit(path.node);
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
    /\.[cm]?[jt]sx?$/.test(ctx.file) && /\b(?:style|[A-Za-z]+Style)=\{|StyleSheet\./.test(ctx.code),
  extract,
  write,
  tokenRef,
};
