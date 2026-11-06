import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { synthesizeStubs } from "./stubs.js";
import type { TypeCheckRecord } from "./types.js";

/**
 * 에이전트가 바꾼 스크립트 파일만 TypeScript 컴파일러(`ts.createProgram`)로 검사한다. 모노레포가 이미 쓰는 `typescript` 패키지를 쓰고 아무것도 설치하지 않는다.
 *
 * 검사하는 것
 *   - 바뀐 .ts·.tsx·.js·.jsx 파일의 구문 진단과 의미 진단(복사본 tsconfig.json의 옵션 그대로 + noEmit·skipLibCheck, 없으면 JSX 기본값).
 *     import가 풀리는 다른 로컬 파일(디자인시스템 컴포넌트 등)은 타입 출처로만 읽고 그 파일의 진단은 세지 않는다.
 *   - 진단 중 위치가 바뀐 파일 안인 오류(category=Error)의 개수가 typeErrors다.
 *   - 존재하지 않는 로컬 모듈·없는 export 이름·로컬 컴포넌트 props 불일치·타입 불일치·정의되지 않은 이름·구문 오류는 잡힌다.
 *
 * 검사하지 못하는 것 — 복사본에 node_modules가 없을 때(하네스의 실행 복사본은 항상 그렇다)
 *   - react·next·clsx 같은 외부 패키지의 타입. 풀리지 않는 패키지는 stubs.ts가 any로 가짜 선언한다(쓰인 이름만, 상속하는 타입은 인덱스 시그니처).
 *     그래서 외부 패키지 API를 잘못 쓴 것(잘못된 훅 인자, 없는 prop 등)은 못 잡고, `React.FC<P>`처럼 외부 타입으로 선언한 컴포넌트의 props도 검사하지 못한다
 *     (함수 선언 `function C(props: P)`로 만든 로컬 컴포넌트는 검사한다).
 *   - JSX 내장 요소의 속성 타입(`JSX.IntrinsicElements`를 any로 두는 가상 선언 파일을 더한다 — `<div onClik>` 같은 오타는 못 잡는다).
 *   - any 때문에 생기는 "매개변수가 암묵적 any"(TS7006) 중 문맥 타입이 any인 것(any인 훅·내장 요소 핸들러에 넘긴 콜백 매개변수),
 *     node 전역을 못 찾는 진단(TS2580·TS2591), any 함수에 타입 인자를 준 진단(TS2347)은 세지 않는다.
 *   - 렌더링·번들링·린트는 하지 않는다. CSS는 검사 대상이 아니다.
 *   이 경우 모드가 "구문·의미 검사(의존성 타입 없이)"로 기록된다. node_modules/react가 풀리면 아무것도 가리지 않고 "타입 검사"로 기록한다.
 */

const SCRIPT = /\.(?:tsx|ts|jsx|js)$/;
const SHIM_NAME = "__bench_shim__.d.ts";
/**
 * 의존성 타입이 없을 때만 나는 진단: Cannot find name 'process'/'require'/'module'(node 타입 필요, 2580·2591),
 * 타입 없는(any) 함수 호출에 타입 인자를 줌(`useState<T>()`, 2347)
 */
const MISSING_DEP_TYPE_CODES: ReadonlySet<number> = new Set([2580, 2591, 2347]);

const JSX_SHIM = [
  "declare namespace JSX {",
  "  interface Element {}",
  "  interface ElementChildrenAttribute { children: {} }",
  "  interface IntrinsicAttributes { key?: any }",
  "  interface IntrinsicElements { [elemName: string]: any }",
  "}",
  "",
].join("\n");

export const MODE_NO_DEPS = "구문·의미 검사(의존성 타입 없이)" as const;
export const MODE_FULL = "타입 검사" as const;

export interface TypeCheckInput {
  /** 복사본(또는 replay의 베이스) 절대 경로 */
  root: string;
  /** 바뀐 파일들의 최종 내용(root 상대 POSIX → 내용). 디스크에 있는 내용보다 우선한다 */
  overlay: ReadonlyMap<string, string>;
  /** 검사 대상 후보(root 상대). 스크립트 확장자만 남긴다 */
  files: readonly string[];
}

function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function hasDependencyTypes(root: string): boolean {
  return fs.existsSync(path.join(root, "node_modules", "@types", "react")) || fs.existsSync(path.join(root, "node_modules", "react"));
}

function baseOptions(root: string): ts.CompilerOptions {
  const configPath = path.join(root, "tsconfig.json");
  let options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    lib: ["lib.dom.d.ts", "lib.dom.iterable.d.ts", "lib.esnext.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    allowJs: true,
    isolatedModules: true,
  };
  if (isFile(configPath)) {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error === undefined) {
      const parsed = ts.parseJsonConfigFileContent(read.config, { ...ts.sys, readDirectory: () => [] }, root, undefined, configPath);
      options = { ...options, ...parsed.options };
    }
  }
  options.noEmit = true;
  options.skipLibCheck = true;
  options.incremental = false;
  options.composite = false;
  delete options.tsBuildInfoFile;
  delete options.declaration;
  delete options.declarationMap;
  return options;
}

function buildProgram(root: string, rootNames: string[], options: ts.CompilerOptions, overlay: Map<string, string>): { program: ts.Program; host: ts.CompilerHost } {
  const host = ts.createCompilerHost(options, true);
  const norm = (f: string): string => path.resolve(f);
  const origFileExists = host.fileExists.bind(host);
  const origReadFile = host.readFile.bind(host);
  const origGetSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (f) => overlay.has(norm(f)) || origFileExists(f);
  host.readFile = (f) => overlay.get(norm(f)) ?? origReadFile(f);
  host.getSourceFile = (f, languageVersionOrOptions, onError, shouldCreate) => {
    const text = overlay.get(norm(f));
    return text !== undefined ? ts.createSourceFile(f, text, languageVersionOrOptions) : origGetSourceFile(f, languageVersionOrOptions, onError, shouldCreate);
  };
  host.getCurrentDirectory = () => root;
  return { program: ts.createProgram({ rootNames, options, host }), host };
}

function messageOf(d: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(d.messageText, "\n").split("\n")[0] ?? "";
}

/** 위치 pos를 덮는 가장 깊은 노드 */
function nodeAt(sf: ts.SourceFile, pos: number): ts.Node | undefined {
  let found: ts.Node | undefined;
  const visit = (n: ts.Node): void => {
    if (pos >= n.getStart(sf) && pos < n.getEnd()) {
      found = n;
      ts.forEachChild(n, visit);
    }
  };
  ts.forEachChild(sf, visit);
  return found;
}

/**
 * 의존성 타입이 없어서 생긴 진단인가(의존성 타입 없이 검사할 때만 호출):
 *   - `process` 같은 node 전역을 못 찾음(TS2580·TS2591)
 *   - 매개변수의 암묵적 any(TS7006)인데 그 함수의 문맥 타입이 any(any인 훅·내장 요소 속성·any 컴포넌트에 넘긴 콜백)
 */
function isDependencyCaused(d: ts.Diagnostic, sf: ts.SourceFile, checker: ts.TypeChecker): boolean {
  if (MISSING_DEP_TYPE_CODES.has(d.code)) return true;
  if (d.code === 7006 && d.start !== undefined) {
    let n: ts.Node | undefined = nodeAt(sf, d.start);
    while (n !== undefined && !ts.isParameter(n)) n = n.parent;
    const fn = n?.parent;
    if (fn === undefined || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return false;
    const contextual = checker.getContextualType(fn);
    // 인덱스 시그니처(any)로 받는 속성의 문맥 타입은 any 또는 unknown으로 나온다
    if (contextual !== undefined && (contextual.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) return true;
    // 문맥 타입이 비어 있어도, any인 컴포넌트의 JSX 속성이거나 any인 함수 호출의 인자이면 원인은 의존성이다
    const isAny = (node: ts.Node): boolean => (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) !== 0;
    const parent = fn.parent;
    if (ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent)) {
      const opening = parent.parent.parent.parent;
      return (ts.isJsxOpeningElement(opening) || ts.isJsxSelfClosingElement(opening)) && isAny(opening.tagName);
    }
    if (ts.isCallExpression(parent) && parent.arguments.includes(fn)) return isAny(parent.expression);
  }
  return false;
}

/** 에이전트가 바꾼 파일만 검사한다. 던지지 않는다(검사기가 실패하면 mode "검사 안 함" + error). */
export function typeCheckChanged(input: TypeCheckInput): TypeCheckRecord {
  const files = [...new Set(input.files.filter((f) => SCRIPT.test(f) && input.overlay.has(f)))].sort();
  if (files.length === 0) return { mode: "검사 안 함", filesChecked: 0, typeErrors: 0, diagnostics: [] };
  try {
    const root = path.resolve(input.root);
    const full = hasDependencyTypes(root);
    const options = baseOptions(root);
    if (!full) {
      // 외부 타입이 없으면 react-jsx의 jsx-runtime 해석이 막히므로 preserve로 검사한다(JSX 타입 검사는 shim의 any)
      if (options.jsx !== undefined && options.jsx !== ts.JsxEmit.Preserve) options.jsx = ts.JsxEmit.Preserve;
      options.types = [];
    }
    const overlay = new Map<string, string>();
    for (const [rel, text] of input.overlay) overlay.set(path.resolve(root, rel), text);
    const absFiles = files.map((f) => path.resolve(root, f));
    const shimPath = path.resolve(root, SHIM_NAME);

    let built: { program: ts.Program; host: ts.CompilerHost };
    if (full) {
      built = buildProgram(root, absFiles, options, overlay);
    } else {
      overlay.set(shimPath, JSX_SHIM);
      const first = buildProgram(root, [...absFiles, shimPath], options, overlay);
      overlay.set(shimPath, `${JSX_SHIM}${synthesizeStubs(first.program, options, first.host)}`);
      built = buildProgram(root, [...absFiles, shimPath], options, overlay);
    }
    const { program } = built;
    const checker = program.getTypeChecker();

    const diagnostics: TypeCheckRecord["diagnostics"] = [];
    let typeErrors = 0;
    for (let i = 0; i < files.length; i += 1) {
      const rel = files[i] ?? "";
      const sf = program.getSourceFile(absFiles[i] ?? "");
      if (sf === undefined) continue;
      for (const d of [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)]) {
        if (d.category !== ts.DiagnosticCategory.Error) continue;
        if (!full && isDependencyCaused(d, sf, checker)) continue;
        typeErrors += 1;
        if (diagnostics.length < 10) {
          const line = d.file !== undefined && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
          diagnostics.push({ file: rel, line, code: d.code, message: messageOf(d) });
        }
      }
    }
    return { mode: full ? MODE_FULL : MODE_NO_DEPS, filesChecked: files.length, typeErrors, diagnostics };
  } catch (e) {
    return { mode: "검사 안 함", filesChecked: files.length, typeErrors: 0, diagnostics: [], error: e instanceof Error ? e.message : String(e) };
  }
}
