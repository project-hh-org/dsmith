import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { isRatedUsage } from "@dsmith-dev/core";
import { describe, expect, it } from "vitest";
import { reactNativeExtractor } from "../src/index.js";

const root = fileURLToPath(new URL("../../../fixtures/rn-app", import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("fixtures/rn-app 집계", () => {
  it("파일별 사용 수·출처·점수 대상이 고정되어 있다", () => {
    const rows: Record<string, { total: number; hardcoded: number; dynamic: number; refs: number; spreads: number; rated: number }> = {};
    for (const path of sourceFiles(root).sort()) {
      const file = relative(root, path).split("\\").join("/");
      const code = readFileSync(path, "utf8");
      if (!reactNativeExtractor.appliesTo({ root, file, code })) continue;
      const usages = reactNativeExtractor.extract({ root, file, code });
      rows[file] = {
        total: usages.length,
        hardcoded: usages.filter((u) => u.source === "hardcoded").length,
        dynamic: usages.filter((u) => u.source === "dynamic").length,
        refs: usages.filter((u) => u.ref !== undefined && u.ref.spread !== true).length,
        spreads: usages.filter((u) => u.ref?.spread === true).length,
        rated: usages.filter(isRatedUsage).length,
      };
    }
    expect(rows).toMatchInlineSnapshot(`
      {
        "app/index.tsx": {
          "dynamic": 8,
          "hardcoded": 15,
          "rated": 12,
          "refs": 2,
          "spreads": 2,
          "total": 23,
        },
        "app/profile.tsx": {
          "dynamic": 8,
          "hardcoded": 7,
          "rated": 10,
          "refs": 2,
          "spreads": 0,
          "total": 15,
        },
        "app/settings.tsx": {
          "dynamic": 7,
          "hardcoded": 10,
          "rated": 10,
          "refs": 4,
          "spreads": 0,
          "total": 17,
        },
        "src/components/ui.tsx": {
          "dynamic": 14,
          "hardcoded": 1,
          "rated": 9,
          "refs": 10,
          "spreads": 1,
          "total": 15,
        },
      }
    `);
  });
});
