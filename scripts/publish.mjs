// 워크스페이스의 공개 패키지를 배포한다. 레지스트리에 이미 있는 버전은 건너뛴다.
// `pnpm publish -r`도 이미 배포된 버전을 건너뛰지만, 배포 직후 레지스트리 반영이 늦으면
// "없음"으로 보고 다시 올리다 E409(previously published/staged)로 실행 전체가 실패한다.
// 여기서는 패키지마다 먼저 확인하고, 확인 뒤에 E409가 나도 "이미 있음"으로 보고 넘어간다.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run");

/** packages/* 중 private이 아닌 패키지 */
function workspacePackages() {
  const dir = path.join(root, "packages");
  return fs
    .readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((p) => fs.existsSync(path.join(p, "package.json")))
    .map((p) => ({ dir: p, pkg: JSON.parse(fs.readFileSync(path.join(p, "package.json"), "utf8")) }))
    .filter(({ pkg }) => pkg.private !== true);
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", env: process.env });
  return { status: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/** 레지스트리에 name@version이 있으면 true. 404면 false, 그 밖의 오류는 던진다 */
function isPublished(name, version) {
  const r = run("npm", ["view", `${name}@${version}`, "version", "--json"], root);
  if (r.status === 0) return r.out.trim().length > 0;
  if (/E404|404 Not Found|is not in this registry/i.test(r.out)) return false;
  throw new Error(`npm view ${name}@${version} 실패:\n${r.out}`);
}

/** 반영 지연으로 "이미 있음"을 뒤늦게 알려 주는 오류 */
export function isAlreadyPublishedError(out) {
  return /E409|EPUBLISHCONFLICT|previously published|previously staged|cannot publish over/i.test(out);
}

function main() {
  const published = [];
  const skipped = [];
  for (const { dir, pkg } of workspacePackages()) {
    const id = `${pkg.name}@${pkg.version}`;
    if (isPublished(pkg.name, pkg.version)) {
      skipped.push(id);
      console.log(`건너뜀(이미 있음): ${id}`);
      continue;
    }
    if (dryRun) {
      console.log(`배포 예정: ${id}`);
      continue;
    }
    const r = run("pnpm", ["publish", "--access", "public", "--no-git-checks"], dir);
    process.stdout.write(r.out);
    if (r.status === 0) {
      published.push(id);
    } else if (isAlreadyPublishedError(r.out)) {
      skipped.push(id);
      console.log(`건너뜀(배포 중 이미 있음 확인): ${id}`);
    } else {
      console.error(`배포 실패: ${id}`);
      process.exit(1);
    }
  }
  console.log(`배포 ${published.length}개, 건너뜀 ${skipped.length}개`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
