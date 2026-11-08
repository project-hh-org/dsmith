import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { sha256Text } from "@dsmith-dev/core";
import { REPOS } from "../src/base.js";
import { BUILTIN_EXTRACTORS, extractorsFor } from "../src/extractors.js";
import { loadPrompts, parsePrompt } from "../src/prompts.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const promptsDir = path.resolve(here, "../prompts");

const IDS = [
  "01-form",
  "02-modal",
  "03-list",
  "04-card",
  "05-table",
  "06-badge",
  "07-tabs",
  "08-toast",
  "09-sidebar",
  "10-settings",
  "11-empty",
  "12-pagination",
];
const HEAD = "이 레포 스타일로 ";
const TAIL = "다른 파일은 고치지 말고 그 파일 하나만 만드세요. 패키지 설치나 빌드·테스트 실행은 하지 마세요.";

describe("loadPrompts", () => {
  it("12개를 id 순서대로 읽는다", async () => {
    const prompts = await loadPrompts(promptsDir);
    expect(prompts.map((p) => p.id)).toEqual(IDS);
  });

  it("본문은 고정 머리·꼬리를 갖고 file을 그대로 포함한다", async () => {
    for (const p of await loadPrompts(promptsDir)) {
      expect(p.text.startsWith(HEAD), p.id).toBe(true);
      expect(p.text.endsWith(TAIL), p.id).toBe(true);
      expect(p.text, p.id).toContain(p.file);
      expect(p.text, p.id).not.toContain("`");
      expect(p.sha256).toBe(sha256Text(p.text));
    }
  });

  it("file은 모두 src/components/ 아래이고 서로 다르며 두 대상 레포에 없다", async () => {
    const prompts = await loadPrompts(promptsDir);
    for (const p of prompts) {
      expect(p.file.startsWith("src/components/"), p.id).toBe(true);
      expect(p.file, p.id).toMatch(/^src\/components\/[A-Za-z]+\.tsx$/);
      for (const repo of ["examples/legacy-demo", "fixtures/with-ds-app"]) {
        expect(fs.existsSync(path.join(repoRoot, repo, p.file)), `${repo}/${p.file}`).toBe(false);
      }
    }
    expect(new Set(prompts.map((p) => p.file)).size).toBe(prompts.length);
  });

  it("ids를 주면 그 id만, 없는 id는 Error", async () => {
    const one = await loadPrompts(promptsDir, ["06-badge"]);
    expect(one).toHaveLength(1);
    expect(one[0]?.text).toBe(
      "이 레포 스타일로 재고 상태(충분·부족·품절)를 보여 주는 배지 컴포넌트를 src/components/StockStatusBadge.tsx 에 만들어 주세요. 다른 파일은 고치지 말고 그 파일 하나만 만드세요. 패키지 설치나 빌드·테스트 실행은 하지 마세요.",
    );
    await expect(loadPrompts(promptsDir, ["99-nope"])).rejects.toThrow(/99-nope/);
  });
});

describe("parsePrompt", () => {
  const ok = "---\nid: 01-form\nfile: src/components/A.tsx\n---\n이 레포 스타일로 src/components/A.tsx 를 만드세요.\n";

  it("앞뒤 공백을 자른 본문을 돌려준다", () => {
    const p = parsePrompt("01-form.md", ok);
    expect(p).toMatchObject({ id: "01-form", file: "src/components/A.tsx", text: "이 레포 스타일로 src/components/A.tsx 를 만드세요." });
  });

  it("frontmatter 누락 → Error(파일 이름 포함)", () => {
    expect(() => parsePrompt("x.md", "그냥 본문 src/components/A.tsx")).toThrow(/x\.md/);
  });

  it("id 형식 오류 → Error", () => {
    expect(() => parsePrompt("bad.md", ok.replace("01-form", "1-Form"))).toThrow(/bad\.md/);
  });

  it("본문에 file이 없으면 Error", () => {
    expect(() => parsePrompt("nofile.md", ok.replace("src/components/A.tsx 를", "그 파일을"))).toThrow(/nofile\.md/);
  });

  it("file이 절대 경로·.. 이면 Error", () => {
    expect(() => parsePrompt("abs.md", ok.replaceAll("src/components/A.tsx", "/etc/a.tsx"))).toThrow(/abs\.md/);
    expect(() => parsePrompt("up.md", ok.replaceAll("src/components/A.tsx", "../a.tsx"))).toThrow(/up\.md/);
  });
});

const rnDir = path.resolve(here, "../prompts-rn");
const RN_IDS = [
  "01-settings-list",
  "02-confirm-sheet",
  "03-history-list",
  "04-summary-card",
  "05-profile-form",
  "06-status-badge",
  "07-segmented-tabs",
  "08-toast",
  "09-empty-view",
  "10-settings-screen",
  "11-detail-screen",
  "12-search-screen",
];

describe("RN 프롬프트 세트(prompts-rn)", () => {
  it("12개를 id 순서대로 읽는다", async () => {
    expect((await loadPrompts(rnDir)).map((p) => p.id)).toEqual(RN_IDS);
  });

  it("본문은 '이 앱 스타일로 '로 시작해 웹 세트와 같은 꼬리로 끝나고 file을 그대로 포함한다", async () => {
    for (const p of await loadPrompts(rnDir)) {
      expect(p.text.startsWith("이 앱 스타일로 "), p.id).toBe(true);
      expect(p.text.endsWith(TAIL), p.id).toBe(true);
      expect(p.text, p.id).toContain(p.file);
      expect(p.text, p.id).not.toContain("`");
      expect(p.sha256).toBe(sha256Text(p.text));
    }
  });

  it("file은 app/bench-*.tsx 또는 src/components/*.tsx뿐이고 서로 다르며 공개 RN fixture에 없다", async () => {
    const prompts = await loadPrompts(rnDir);
    for (const p of prompts) {
      expect(p.file, p.id).toMatch(/^(?:app\/bench-[a-z]+|src\/components\/[A-Za-z]+)\.tsx$/);
      expect(fs.existsSync(path.join(repoRoot, "fixtures/rn-app", p.file)), p.file).toBe(false);
    }
    expect(new Set(prompts.map((p) => p.file)).size).toBe(prompts.length);
    expect(prompts.filter((p) => p.file.startsWith("app/")).map((p) => p.id)).toEqual(["10-settings-screen", "11-detail-screen", "12-search-screen"]);
  });

  it("레포별 프롬프트 세트: 웹 레포는 prompts, RN 레포는 prompts-rn", () => {
    expect(REPOS["legacy-demo"].prompts).toBe("prompts");
    expect(REPOS["with-ds-app"].prompts).toBe("prompts");
    expect(REPOS["rn-app"].prompts).toBe("prompts-rn");
    expect(REPOS["knowing-saju"].prompts).toBe("prompts-rn");
  });

  it("웹 세트 12개의 본문 sha256은 RN 세트 추가 전과 같다", async () => {
    const shas = (await loadPrompts(promptsDir)).map((p) => `${p.id}:${p.sha256.slice(0, 12)}`);
    expect(shas).toEqual([
      "01-form:d28007a2b33c",
      "02-modal:9e026c231334",
      "03-list:ff61d2384e64",
      "04-card:aeda48100f80",
      "05-table:61a78b96f271",
      "06-badge:3b4fc838e338",
      "07-tabs:8ad0a5f787a0",
      "08-toast:9c6ebe5e00b8",
      "09-sidebar:98502052d2ef",
      "10-settings:148f4f3df473",
      "11-empty:67cc3ef9aa7e",
      "12-pagination:316ba594e1d2",
    ]);
  });
});

describe("extractors", () => {
  it("내장 Extractor 7종 이름이 cli registry와 같다", () => {
    expect(Object.keys(BUILTIN_EXTRACTORS).sort()).toEqual([
      "css",
      "emotion",
      "inline-style",
      "mui-sx",
      "react-native-stylesheet",
      "styled",
      "tailwind",
    ]);
    for (const [name, e] of Object.entries(BUILTIN_EXTRACTORS)) expect(e.name).toBe(name);
  });

  it("extractorsFor: 이름 순서대로, 모르는 이름은 Error", () => {
    expect(extractorsFor(["tailwind", "css"]).map((e) => e.name)).toEqual(["tailwind", "css"]);
    expect(() => extractorsFor(["nope"])).toThrow(/nope/);
  });
});
