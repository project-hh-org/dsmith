import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GENERATED_NOTICE, readMigration } from "@dsmith-dev/core";
import { applyPrefixRename, leftoverRefs, planPrefixRename } from "../src/rename-prefix.js";
import { revertMigration } from "../src/revert.js";

const tmps: string[] = [];
afterEach(() => {
  for (const t of tmps.splice(0)) fs.rmSync(t, { recursive: true, force: true });
});

const LEGACY_CSS = `/* ${GENERATED_NOTICE} */\n:root {\n  --color-blue-400: #3b82f6;\n  --space-2: 8px;\n}\n`;
const DS_CSS = LEGACY_CSS.replaceAll("--color-", "--ds-color-").replaceAll("--space-", "--ds-space-");

function repo(files: Record<string, string>, ds = false): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-rename-")));
  tmps.push(root);
  const all: Record<string, string> = {
    "design-system/tokens.css": ds ? DS_CSS : LEGACY_CSS,
    "design-system/tokens.json": `${JSON.stringify(ds ? { $extensions: { "dev.dsmith": { cssPrefix: "ds" } } } : {}, null, 2)}\n`,
    ...files,
  };
  for (const [file, content] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

function treeHash(root: string): string {
  const hash = createHash("sha256");
  const walk = (dir: string, prefix: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = `${prefix}${e.name}`;
      if (rel === ".dsmith") continue;
      if (e.isDirectory()) walk(path.join(dir, e.name), `${rel}/`);
      else hash.update(rel).update("\0").update(fs.readFileSync(path.join(dir, e.name))).update("\0");
    }
  };
  walk(root, "");
  return hash.digest("hex");
}

const A_CSS = `.a { color: var(--color-blue-400); padding: var( --space-2 , 8px); }\n`;
const B_TSX = `export const B = () => (
  <div style={{ color: "var(--color-blue-400)" }} className="bg-[color:var(--color-blue-400)] p-[var(--space-2)]">
    {(document.body.style.setProperty("--color-blue-400", "red"), null)}
  </div>
);
`;
const C_CSS = `.c { color: var(--color-blue-400-2); margin: var(--other); }\n`;
const SOURCES = { "src/a.css": A_CSS, "src/b.tsx": B_TSX, "src/c.css": C_CSS };

describe("planPrefixRename", () => {
  it("var() 참조만 세고, -2 접미 토큰과 var() 밖 언급은 따로 센다. 아무것도 쓰지 않는다", async () => {
    const root = repo(SOURCES);
    const before = treeHash(root);
    const plan = await planPrefixRename(root, { exclude: [] });
    expect(plan.naming).toBe("legacy");
    expect(plan.initDir).toBe("design-system");
    expect(plan.renames).toEqual([
      { from: "--color-blue-400", to: "--ds-color-blue-400" },
      { from: "--space-2", to: "--ds-space-2" },
    ]);
    expect(plan.files.map((f) => [f.file, f.refs])).toEqual([
      ["src/a.css", 2],
      ["src/b.tsx", 3],
    ]);
    expect(plan.mentions).toEqual([{ file: "src/b.tsx", line: 3, name: "--color-blue-400" }]);
    expect(plan.files.some((f) => f.file.startsWith("design-system/"))).toBe(false);
    expect(treeHash(root)).toBe(before);
    expect(fs.existsSync(path.join(root, ".dsmith"))).toBe(false);
  });

  it("이미 ds 형식이면 비어 있다", async () => {
    const root = repo({ "src/a.css": `.a { color: var(--ds-color-blue-400); }\n` }, true);
    const plan = await planPrefixRename(root, { exclude: [] });
    expect(plan.naming).toBe("ds");
    expect(plan.renames).toEqual([]);
    expect(plan.files).toEqual([]);
  });

  it("init 산출이 없으면 initDir null", async () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-rename-")));
    tmps.push(root);
    const plan = await planPrefixRename(root, { exclude: [] });
    expect(plan.initDir).toBeNull();
    expect(plan.files).toEqual([]);
  });

  it("exclude glob 파일은 건드리지 않는다", async () => {
    const root = repo(SOURCES);
    const plan = await planPrefixRename(root, { exclude: ["src/b.tsx"] });
    expect(plan.files.map((f) => f.file)).toEqual(["src/a.css"]);
  });
});

describe("applyPrefixRename", () => {
  it("참조를 바꾸고 kind rename-prefix 기록을 남기며, revertMigration으로 바이트 동일하게 되돌린다", async () => {
    const root = repo(SOURCES);
    const before = treeHash(root);
    const plan = await planPrefixRename(root, { exclude: [] });
    const applied = await applyPrefixRename(root, plan, { version: "0.0.0-test", now: new Date(2026, 10, 8, 12, 0, 0) });
    expect(applied.files.map((f) => f.status)).toEqual(["applied", "applied"]);
    expect(fs.readFileSync(path.join(root, "src/a.css"), "utf-8")).toBe(`.a { color: var(--ds-color-blue-400); padding: var( --ds-space-2 , 8px); }\n`);
    expect(fs.readFileSync(path.join(root, "src/b.tsx"), "utf-8")).toContain(`setProperty("--color-blue-400"`);
    expect(fs.readFileSync(path.join(root, "src/c.css"), "utf-8")).toBe(C_CSS);
    const record = await readMigration(root, applied.id);
    expect(record).toMatchObject({ kind: "rename-prefix", status: "applied", summary: { tokens: 5, files: 2 } });
    expect(await leftoverRefs(root, plan.renames, { exclude: [] })).toEqual([]);

    const reverted = await revertMigration(root, applied.id);
    expect(reverted.files.every((f) => f.status === "reverted")).toBe(true);
    expect(treeHash(root)).toBe(before);
  });

  it("계획 뒤 바뀐 파일은 쓰지 않고 남은 참조로 보인다", async () => {
    const root = repo(SOURCES);
    const plan = await planPrefixRename(root, { exclude: [] });
    fs.writeFileSync(path.join(root, "src/a.css"), `${A_CSS}/* edited */\n`);
    const applied = await applyPrefixRename(root, plan, { version: "0.0.0-test" });
    expect(applied.files.find((f) => f.file === "src/a.css")).toMatchObject({ status: "changed-since-plan" });
    expect(applied.files.find((f) => f.file === "src/b.tsx")?.status).toBe("applied");
    const left = await leftoverRefs(root, plan.renames, { exclude: [] });
    expect(left.map((l) => l.file)).toEqual(["src/a.css", "src/a.css"]);
  });
});
