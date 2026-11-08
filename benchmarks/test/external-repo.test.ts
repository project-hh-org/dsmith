import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { EXTERNAL_REPOS } from "../src/model.js";
import { MONOREPO_ROOT, REPOS, externalCopyFilter, isExternalRepo, prepareBase } from "../src/base.js";
import { isInsideMonorepo } from "../src/paths.js";
import { parseBenchArgs, planBench } from "../src/run.js";
import { cleanupTmps, tmpDir } from "./helpers.js";

afterAll(cleanupTmps);

const ENV_NAME = "DSMITH_BENCH_REPO_PATH";
/** 환경 변수 없이, 모노레포 밖 cwd 기준으로 해석하는 깨끗한 env */
const cleanEnv = (extra: Record<string, string> = {}): NodeJS.ProcessEnv => ({ PATH: process.env.PATH ?? "", INIT_CWD: os.tmpdir(), ...extra });

/** 모노레포 밖의 가짜 외부 앱(package.json만 있음) */
function fakeApp(): string {
  const dir = tmpDir("dsmith-bench-ext-app-");
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { "react-native": "0.76.0" } }));
  return dir;
}

describe("REPOS", () => {
  it("knowing-saju만 외부 레포이고 RN 프롬프트 세트를 쓴다, rn-app은 공개 fixture", () => {
    expect(REPOS["knowing-saju"]).toEqual({ kind: "external", env: ENV_NAME, prompts: "prompts-rn" });
    expect(REPOS["rn-app"]).toEqual({ kind: "builtin", dir: "fixtures/rn-app", prompts: "prompts-rn" });
    expect(fs.existsSync(path.join(MONOREPO_ROOT, "fixtures/rn-app/package.json"))).toBe(true);
    expect(Object.keys(REPOS).filter((r) => isExternalRepo(r as keyof typeof REPOS))).toEqual([...EXTERNAL_REPOS]);
  });
});

describe("parseBenchArgs — 외부 레포 검증(실패하면 종료 코드 2가 되는 Error)", () => {
  const dry = ["--repo", "knowing-saju", "--dry-run"];

  it("--repo-path도 환경 변수도 없으면 안내와 함께 Error", () => {
    expect(() => parseBenchArgs(dry, cleanEnv())).toThrow(new RegExp(`--repo-path[\\s\\S]*${ENV_NAME}`));
  });

  it("모노레포 안 경로는 Error(모노레포 자신·fixture·하위 모두), 심볼릭 링크로 들어와도 막는다", () => {
    expect(() => parseBenchArgs([...dry, "--repo-path", MONOREPO_ROOT], cleanEnv())).toThrow(/모노레포 안/);
    expect(() => parseBenchArgs([...dry, "--repo-path", path.join(MONOREPO_ROOT, "fixtures/rn-app")], cleanEnv())).toThrow(/모노레포 안/);
    expect(() => parseBenchArgs(dry, cleanEnv({ [ENV_NAME]: path.join(MONOREPO_ROOT, "fixtures/rn-app") }))).toThrow(/모노레포 안/);
    const link = path.join(tmpDir("dsmith-bench-ext-link-"), "app");
    fs.symlinkSync(path.join(MONOREPO_ROOT, "fixtures/rn-app"), link);
    expect(() => parseBenchArgs([...dry, "--repo-path", link], cleanEnv())).toThrow(/모노레포 안/);
  });

  it("없는 경로·파일·package.json 없는 디렉터리는 Error", () => {
    const empty = tmpDir("dsmith-bench-ext-empty-");
    const file = path.join(empty, "f.txt");
    fs.writeFileSync(file, "x");
    expect(() => parseBenchArgs([...dry, "--repo-path", path.join(empty, "nope")], cleanEnv())).toThrow(/찾을 수 없습니다/);
    expect(() => parseBenchArgs([...dry, "--repo-path", file], cleanEnv())).toThrow(/디렉터리가 아닙니다/);
    expect(() => parseBenchArgs([...dry, "--repo-path", empty], cleanEnv())).toThrow(/package\.json/);
  });

  it("--repo-path는 환경 변수보다 앞서고, 둘 중 하나면 된다. 오류 메시지·결과 인자에 경로 내용을 새기지 않는다", () => {
    const app = fakeApp();
    const viaFlag = parseBenchArgs([...dry, "--repo-path", app], cleanEnv({ [ENV_NAME]: "/definitely/not/here" }));
    expect(viaFlag.repoPath).toBe(fs.realpathSync(app));
    expect(parseBenchArgs(dry, cleanEnv({ [ENV_NAME]: app })).repoPath).toBe(fs.realpathSync(app));
    expect(() => parseBenchArgs([...dry, "--repo-path", "/definitely/not/here"], cleanEnv())).toThrow(/^(?![\s\S]*definitely)/);
  });

  it("--repo-path는 외부 레포에만 쓴다", () => {
    expect(() => parseBenchArgs(["--repo", "rn-app", "--dry-run", "--repo-path", fakeApp()], cleanEnv())).toThrow(/외부 레포/);
    expect(parseBenchArgs(["--repo", "rn-app", "--dry-run"], cleanEnv()).repoPath).toBeNull();
  });

  it("실행(dry-run 아님)에는 --out이 필수이고, agent 실행에는 --record도 필수 — 모두 모노레포 밖", () => {
    const app = fakeApp();
    const outDir = tmpDir("dsmith-bench-ext-out-");
    const base = ["--repo", "knowing-saju", "--repo-path", app];
    expect(() => parseBenchArgs([...base, "--agent", "claude -p"], cleanEnv())).toThrow(/--out/);
    expect(() => parseBenchArgs([...base, "--agent", "claude -p", "--out", path.join(outDir, "ks.json")], cleanEnv())).toThrow(/--record/);
    expect(() => parseBenchArgs([...base, "--agent", "claude -p", "--out", path.join(MONOREPO_ROOT, "benchmarks/results/ks.json"), "--record", path.join(outDir, "rec")], cleanEnv())).toThrow(/--out이 모노레포 안/);
    expect(() => parseBenchArgs([...base, "--agent", "claude -p", "--out", path.join(outDir, "ks.json"), "--record", path.join(MONOREPO_ROOT, "benchmarks/results/ks/outputs")], cleanEnv())).toThrow(/--record가 모노레포 안/);
    // dry-run은 --out 없이도 계획을 보여 주지만, 주어진 --out이 안이면 막는다
    expect(parseBenchArgs([...base, "--dry-run"], cleanEnv()).out).toBeNull();
    expect(() => parseBenchArgs([...base, "--dry-run", "--out", path.join(MONOREPO_ROOT, "x.json")], cleanEnv())).toThrow(/--out이 모노레포 안/);
    const ok = parseBenchArgs([...base, "--agent", "claude -p", "--out", path.join(outDir, "ks.json"), "--record", path.join(outDir, "ks-out")], cleanEnv());
    expect(ok).toMatchObject({ repo: "knowing-saju", out: path.join(outDir, "ks.json"), record: path.join(outDir, "ks-out") });
  });

  it("공개 레포의 기본 동작은 그대로: --out·--record 없이도 된다", () => {
    expect(parseBenchArgs(["--repo", "rn-app", "--agent", "echo"], cleanEnv())).toMatchObject({ repo: "rn-app", repoPath: null, out: null, record: null });
  });
});

describe("isInsideMonorepo", () => {
  it("없는 경로는 가장 가까운 기존 조상으로 판단한다", () => {
    expect(isInsideMonorepo(path.join(MONOREPO_ROOT, "benchmarks/results/new/dir/x.json"))).toBe(true);
    expect(isInsideMonorepo(path.join(os.tmpdir(), "no/such/dir/x.json"))).toBe(false);
    expect(isInsideMonorepo(MONOREPO_ROOT)).toBe(true);
  });
});

describe("planBench — 외부 레포 계획", () => {
  it("경로를 출력하지 않고 RN 프롬프트 12개로 계획한다", async () => {
    const app = fakeApp();
    const lines = await planBench(parseBenchArgs(["--repo", "knowing-saju", "--repo-path", app, "--dry-run", "--date", "2026-11-09"], cleanEnv()));
    const text = lines.join("\n");
    expect(text).toContain("knowing-saju");
    expect(text).toContain("외부 비공개 앱");
    expect(text).not.toContain(app);
    expect(text).not.toContain(path.basename(app));
    expect(text).toMatch(/프롬프트 12개: 01-settings-list/);
    expect(text).toContain("실행 수: 24 (순차)");
  });
});

describe("externalCopyFilter", () => {
  it("비밀·네이티브·설치물·도구 작업 파일을 거른다", () => {
    for (const rejected of [
      "/app/.env",
      "/app/.env.local",
      "/app/.envrc",
      "/app/certs/server.pem",
      "/app/certs/private.key",
      "/app/certs/sign.p12",
      "/app/android-release.keystore",
      "/app/.env.production",
      "/app/ios",
      "/app/android",
      "/app/node_modules",
      "/app/.git",
      "/app/.expo",
      "/app/dist",
      "/app/build",
      "/app/.dsmith",
      "/app/keys/AuthKey_X.p8",
      "/app/cert.p12",
      "/app/release.keystore",
      "/app/debug.jks",
      "/app/x.mobileprovision",
      "/app/google-services.json",
      "/app/GoogleService-Info.plist",
    ]) {
      expect(externalCopyFilter(rejected), rejected).toBe(false);
    }
    for (const kept of ["/app/src/theme.ts", "/app/app/index.tsx", "/app/package.json", "/app/envelope.ts", "/app/.gitignore", "/app/assets/icon.png"]) {
      expect(externalCopyFilter(kept), kept).toBe(true);
    }
  });
});

describe("prepareBase — 외부 앱 복사", () => {
  it("비밀·네이티브 파일은 복사본에 없고, 앱 코드는 있으며, JS 테마 참조 해석기가 붙는다", async () => {
    const app = tmpDir("dsmith-bench-ext-copy-");
    fs.cpSync(path.join(MONOREPO_ROOT, "fixtures/rn-app"), app, { recursive: true });
    for (const [file, content] of [
      [".env.local", "SECRET=1"],
      ["ios/Podfile", "x"],
      ["android/app/google-services.json", "{}"],
      ["node_modules/x/index.js", "x"],
      ["certs/key.p8", "x"],
      ["GoogleService-Info.plist", "x"],
    ] as const) {
      fs.mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
      fs.writeFileSync(path.join(app, file), content);
    }
    const base = await prepareBase("knowing-saju", { repoPath: app, env: {} });
    try {
      expect(path.relative(MONOREPO_ROOT, base.dir).startsWith("..")).toBe(true);
      for (const gone of [".env.local", "ios", "android", "node_modules", "certs/key.p8", "GoogleService-Info.plist"]) {
        expect(fs.existsSync(path.join(base.dir, gone)), gone).toBe(false);
      }
      expect(fs.existsSync(path.join(base.dir, "src/theme.ts"))).toBe(true);
      expect(fs.existsSync(path.join(base.dir, "app/settings.tsx"))).toBe(true);
      expect(fs.existsSync(path.join(base.dir, ".dsmith/catalog.json"))).toBe(true);
      expect(base.snapshot.tokens.some((t) => t.js !== undefined)).toBe(true);
      // 원본은 건드리지 않는다
      expect(fs.existsSync(path.join(app, ".env.local"))).toBe(true);
      expect(fs.existsSync(path.join(app, ".dsmith"))).toBe(false);
    } finally {
      fs.rmSync(base.dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe("CLI: 외부 레포 오류는 종료 코드 2", () => {
  const cli = path.join(MONOREPO_ROOT, "benchmarks/dist/run.js");
  const run = (argv: string[], env: Record<string, string> = {}) => {
    const { [ENV_NAME]: _drop, ...rest } = process.env;
    return spawnSync(process.execPath, [cli, ...argv], { cwd: os.tmpdir(), encoding: "utf-8", env: { ...rest, ...env } });
  };

  it("경로 없음 → 2 + 안내, 모노레포 안 → 2, 정상 dry-run → 0", () => {
    const none = run(["--repo", "knowing-saju", "--dry-run"]);
    expect(none.status).toBe(2);
    expect(none.stderr).toContain(ENV_NAME);
    expect(none.stdout).toBe("");
    expect(run(["--repo", "knowing-saju", "--dry-run", "--repo-path", path.join(MONOREPO_ROOT, "fixtures/rn-app")]).status).toBe(2);
    const app = fakeApp();
    const ok = run(["--repo", "knowing-saju", "--dry-run"], { [ENV_NAME]: app });
    expect(ok.status).toBe(0);
    expect(ok.stdout).not.toContain(app);
  });
});
