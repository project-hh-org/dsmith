import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { MODE_NO_DEPS, typeCheckChanged } from "../src/independent/index.js";

const tmps: string[] = [];
function repo(files: Record<string, string>): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-tc-")));
  tmps.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
afterAll(() => {
  for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
});

const TSCONFIG = JSON.stringify({
  compilerOptions: { target: "es2017", lib: ["dom", "esnext"], strict: true, module: "esnext", moduleResolution: "bundler", jsx: "preserve", baseUrl: ".", paths: { "@/*": ["./src/*"] } },
});

const run = (root: string, overlay: Record<string, string>) =>
  typeCheckChanged({ root, overlay: new Map(Object.entries(overlay)), files: Object.keys(overlay) });

describe("typeCheckChanged — 구문·의미 검사(의존성 타입 없이)", () => {
  const root = repo({
    "tsconfig.json": TSCONFIG,
    "src/lib/math.ts": `export function double(n: number): number { return n * 2; }\nexport const broken: number = "not in changed file";\n`,
    "src/ui/Card.tsx": `export function Card(props: { title: string }) { return <section>{props.title}</section>; }\n`,
  });

  it("깨끗한 파일: react 같은 패키지 import와 JSX 내장 요소 핸들러가 오류를 내지 않는다", () => {
    const r = run(root, {
      "src/a.tsx": [
        `import { useState, type FormEvent } from "react";`,
        `import clsx from "clsx";`,
        `export function A() {`,
        `  const [v, setV] = useState("");`,
        `  const submit = (e: FormEvent) => e.preventDefault();`,
        `  return <form onSubmit={submit}><input value={v} onChange={(e) => setV(e.target.value)} className={clsx("a")} /></form>;`,
        `}`,
      ].join("\n"),
    });
    expect(r).toMatchObject({ mode: MODE_NO_DEPS, filesChecked: 1, typeErrors: 0 });
  });

  it("타입 불일치는 세고 위치를 남긴다", () => {
    const r = run(root, { "src/b.ts": `export const x: number = "s";\n` });
    expect(r.typeErrors).toBe(1);
    expect(r.diagnostics[0]).toMatchObject({ file: "src/b.ts", line: 1, code: 2322 });
  });

  it("없는 로컬 모듈·없는 export·로컬 함수 인자 불일치는 오류", () => {
    const r = run(root, {
      "src/c.tsx": [
        `import { nope } from "./missing";`,
        `import { triple } from "@/lib/math";`,
        `import { double } from "../src/lib/math";`,
        `import { Card } from "./ui/Card";`,
        `export const v = double("x");`,
        `export const el = <Card />;`,
      ].join("\n"),
    });
    // ./missing(2307) · triple 없음(2305) · double("x")(2345) · <Card />에 title 없음(2322)
    expect(r.typeErrors).toBe(4);
    expect(r.diagnostics.map((d) => d.code).sort()).toEqual([2305, 2307, 2322, 2345]);
  });

  it("바뀌지 않은 파일의 오류(src/lib/math.ts의 broken)는 세지 않는다", () => {
    const r = run(root, { "src/d.ts": `import { double } from "./lib/math";\nexport const y = double(2);\n` });
    expect(r.typeErrors).toBe(0);
  });

  it("구문 오류는 오류로 센다", () => {
    expect(run(root, { "src/e.ts": `export const = ;\n` }).typeErrors).toBeGreaterThan(0);
  });

  it("react 타입을 상속·사용하는 로컬 컴포넌트: 상속받은 속성은 막지 않고 선언된 props 오류는 잡는다", () => {
    const r2 = repo({
      "tsconfig.json": TSCONFIG,
      "src/ui/Input.tsx": [
        `import React from "react";`,
        `import type { InputHTMLAttributes, ReactNode } from "react";`,
        `export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; hint?: ReactNode }`,
        // React.FC<P>는 외부 타입이라 any로 취급된다 — 이 컴포넌트의 props는 검사하지 못한다(알려진 한계)
        `export const FcInput: React.FC<InputProps> = ({ label }) => <label>{label}</label>;`,
        `export function Input({ label }: InputProps) { return <label>{label}</label>; }`,
      ].join("\n"),
    });
    expect(run(r2, { "src/d.tsx": `import { FcInput } from "./ui/Input";\nexport const D = () => <FcInput />;\n` }).typeErrors).toBe(0);
    const ok = run(r2, { "src/a.tsx": `import { Input } from "./ui/Input";\nexport const A = () => <Input label="x" id="y" onChange={(e) => console.log(e.target.value)} />;\n` });
    expect(ok.typeErrors).toBe(0);
    const missing = run(r2, { "src/b.tsx": `import { Input } from "./ui/Input";\nexport const B = () => <Input />;\n` });
    expect(missing.typeErrors).toBe(1);
    const wrong = run(r2, { "src/c.tsx": `import { Input } from "./ui/Input";\nexport const C = () => <Input label={3} />;\n` });
    expect(wrong.typeErrors).toBe(1);
  });

  it("any인 훅에 넘긴 콜백 매개변수·타입 인자는 오류가 아니고, 로컬 함수의 암묵적 any는 오류", () => {
    const hooks = run(root, {
      "src/h.tsx": [
        `import { useState } from "react";`,
        `export function H() {`,
        `  const [items, setItems] = useState<string[]>([]);`,
        `  return <button onClick={() => setItems((prev) => [...prev, "x"])}>{items.length}</button>;`,
        `}`,
      ].join("\n"),
    });
    expect(hooks.typeErrors).toBe(0);
    const local = run(root, { "src/i.ts": `export function f(x) { return x; }\n` });
    expect(local.typeErrors).toBe(1);
    expect(local.diagnostics[0]?.code).toBe(7006);
  });

  it("검사할 스크립트가 없으면(css·md만) 검사 안 함", () => {
    const r = typeCheckChanged({ root, overlay: new Map([["src/x.css", ".a{}"]]), files: ["src/x.css"] });
    expect(r).toEqual({ mode: "검사 안 함", filesChecked: 0, typeErrors: 0, diagnostics: [] });
  });

  it("복사본에 tsconfig가 없어도 JSX 기본값으로 검사한다", () => {
    const bare = repo({});
    const r = run(bare, { "src/a.tsx": `export const A = () => <div className="x" />;\nexport const n: number = 1;\n` });
    expect(r).toMatchObject({ mode: MODE_NO_DEPS, typeErrors: 0 });
  });

  it("같은 입력이면 같은 결과(결정적)", () => {
    const overlay = { "src/f.ts": `export const x: string = 1;\n` };
    expect(run(root, overlay)).toEqual(run(root, overlay));
  });
});
