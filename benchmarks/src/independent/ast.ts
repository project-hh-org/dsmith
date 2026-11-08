/** 독립 채점기의 AST 보조 함수 — @babel/parser가 만든 노드를 느슨한 모양으로 다룬다. dsmith 코드를 쓰지 않는다. */

export interface AstNode {
  type: string;
  [key: string]: unknown;
}

export const isNode = (v: unknown): v is AstNode => typeof v === "object" && v !== null && typeof (v as { type?: unknown }).type === "string";

const SKIP_KEYS = new Set(["loc", "start", "end", "range", "leadingComments", "trailingComments", "innerComments", "extra", "tokens", "comments", "errors"]);

export function childNodes(node: AstNode): AstNode[] {
  const out: AstNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (SKIP_KEYS.has(key)) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (isNode(v)) out.push(v);
    } else if (isNode(value)) out.push(value);
  }
  return out;
}

export function nameOf(node: unknown): string | null {
  if (!isNode(node)) return null;
  if (node.type === "Identifier" || node.type === "JSXIdentifier") return typeof node.name === "string" ? node.name : null;
  if (node.type === "StringLiteral") return typeof node.value === "string" ? node.value : null;
  return null;
}

/** `as const`·`satisfies T`·괄호·`<T>x`를 벗긴다 */
export function unwrap(node: unknown): AstNode | null {
  let cur: unknown = node;
  for (let guard = 0; guard < 20 && isNode(cur); guard += 1) {
    if (cur.type === "TSAsExpression" || cur.type === "TSSatisfiesExpression" || cur.type === "TSNonNullExpression" || cur.type === "ParenthesizedExpression" || cur.type === "TSTypeAssertion") cur = cur.expression;
    else return cur;
  }
  return null;
}
