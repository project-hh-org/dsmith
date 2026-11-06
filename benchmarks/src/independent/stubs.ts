import ts from "typescript";

/**
 * 풀리지 않은 외부 패키지(node_modules가 없어 react·clsx 등을 못 찾음)의 "가짜 선언"을 만든다.
 *
 * 프로그램이 읽은 모든 소스 파일의 import를 보고, 풀리지 않는 패키지마다 쓰인 이름만 선언한다:
 *   - 값으로 쓰이는 모든 이름: `export const X: any`
 *   - 타입으로도 쓰이는 이름: 같은 이름의 `export type X<A = any, B = any, C = any, D = any> = any`
 *   - `interface P extends X<…>`·`React.HTMLAttributes<…>`처럼 상속하는 이름: type 대신 `export interface X<…> { [key: string]: any }`
 *     (상속받은 쪽에서 모르는 속성을 만나도 오류가 나지 않게 한다 — 타입이 없어서 생기는 오류를 막으려는 것이지 타입을 흉내 내려는 것이 아니다)
 *   - 기본/네임스페이스 import(`import React from "react"`, `React.FC<P>`)는 `React.멤버`로 쓰인 멤버를 같은 방식으로 담은 타입 전용 네임스페이스와
 *     `const`를 합쳐 default export로 둔다.
 * 결과: 외부 패키지가 any로 취급되고, 그 위에서 로컬 코드(로컬 모듈 경로·로컬 컴포넌트 props·타입 불일치)의 오류만 남는다.
 */

interface ModuleInfo {
  /** 내보내는 이름 → 상속에 쓰이는가 */
  names: Map<string, boolean>;
  /** 기본/네임스페이스 import의 로컬 이름 */
  locals: Set<string>;
  hasDefault: boolean;
}

const GENERICS = "<A = any, B = any, C = any, D = any>";

function isLocalOrAlias(spec: string, options: ts.CompilerOptions): boolean {
  if (spec.startsWith(".") || spec.startsWith("/")) return true;
  for (const pattern of Object.keys(options.paths ?? {})) {
    const star = pattern.indexOf("*");
    if (star === -1 ? spec === pattern : spec.startsWith(pattern.slice(0, star)) && spec.endsWith(pattern.slice(star + 1))) return true;
  }
  return false;
}

/** 프로그램에서 풀리지 않는 패키지 import를 찾아 `declare module` 선언 텍스트를 만든다 */
export function synthesizeStubs(program: ts.Program, options: ts.CompilerOptions, host: ts.ModuleResolutionHost): string {
  const modules = new Map<string, ModuleInfo>();
  const get = (m: string): ModuleInfo => {
    let info = modules.get(m);
    if (info === undefined) {
      info = { names: new Map(), locals: new Set(), hasDefault: false };
      modules.set(m, info);
    }
    return info;
  };

  const files = program.getSourceFiles().filter((sf) => !program.isSourceFileDefaultLibrary(sf) && !program.isSourceFileFromExternalLibrary(sf) && !sf.isDeclarationFile);
  for (const sf of files) {
    // 이 파일에서 풀리지 않는 패키지로 가는 로컬 이름들
    const localToModule = new Map<string, { module: string; imported: string | null }>();
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
      const spec = stmt.moduleSpecifier.text;
      if (isLocalOrAlias(spec, options)) continue;
      if (ts.resolveModuleName(spec, sf.fileName, options, host).resolvedModule !== undefined) continue;
      const info = get(spec);
      const clause = stmt.importClause;
      if (clause === undefined) continue;
      if (clause.name !== undefined) {
        info.hasDefault = true;
        info.locals.add(clause.name.text);
        localToModule.set(clause.name.text, { module: spec, imported: null });
      }
      const b = clause.namedBindings;
      if (b !== undefined && ts.isNamespaceImport(b)) {
        info.hasDefault = true;
        info.locals.add(b.name.text);
        localToModule.set(b.name.text, { module: spec, imported: null });
      } else if (b !== undefined && ts.isNamedImports(b)) {
        for (const e of b.elements) {
          const exported = (e.propertyName ?? e.name).text;
          if (!info.names.has(exported)) info.names.set(exported, false);
          localToModule.set(e.name.text, { module: spec, imported: exported });
        }
      }
    }
    if (localToModule.size === 0) continue;

    const markMember = (local: string, member: string, inherit: boolean): void => {
      const target = localToModule.get(local);
      if (target === undefined) return;
      const info = get(target.module);
      if (target.imported === null) info.names.set(member, (info.names.get(member) ?? false) || inherit);
    };
    const markNamed = (local: string): void => {
      const target = localToModule.get(local);
      if (target === undefined || target.imported === null) return;
      get(target.module).names.set(target.imported, true);
    };
    const visit = (n: ts.Node): void => {
      if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression)) markMember(n.expression.text, n.name.text, false);
      else if (ts.isQualifiedName(n) && ts.isIdentifier(n.left)) markMember(n.left.text, n.right.text, false);
      else if (ts.isHeritageClause(n)) {
        for (const t of n.types) {
          const e = t.expression;
          if (ts.isIdentifier(e)) markNamed(e.text);
          else if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression)) markMember(e.expression.text, e.name.text, true);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  const lines: string[] = [];
  for (const [name, info] of [...modules].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    lines.push(`declare module ${JSON.stringify(name)} {`);
    const decl = (n: string, inherit: boolean, indent: string, exportKw: string, withValue: boolean): void => {
      lines.push(inherit ? `${indent}${exportKw}interface ${n}${GENERICS} { [key: string]: any }` : `${indent}${exportKw}type ${n}${GENERICS} = any;`);
      if (withValue) lines.push(`${indent}${exportKw}const ${n}: any;`);
    };
    for (const [n, inherit] of [...info.names].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      if (n === "default") continue;
      decl(n, inherit, "  ", "export ", true);
    }
    if (info.hasDefault) {
      lines.push("  namespace __bench_default {");
      for (const [n, inherit] of [...info.names].sort((a, b) => (a[0] < b[0] ? -1 : 1))) if (n !== "default") decl(n, inherit, "    ", "", false);
      lines.push("  }", "  const __bench_default: any;", "  export default __bench_default;");
    }
    lines.push("}");
  }
  return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
}
