import fs from "node:fs/promises";
import path from "node:path";
import type { InstalledSurfaces } from "./agents-section.js";

async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/** JSON 설정에 `mcpServers.dsmith`가 있는가 (Claude Code `.mcp.json`, Cursor `.cursor/mcp.json`, Gemini `.gemini/settings.json`) */
async function jsonHasDsmith(file: string): Promise<boolean> {
  const text = await readText(file);
  if (text === null) return false;
  try {
    const servers = (JSON.parse(text) as { mcpServers?: unknown } | null)?.mcpServers;
    return typeof servers === "object" && servers !== null && "dsmith" in servers;
  } catch {
    return false;
  }
}

const SKILL_FILE = /(?:^|\/)(?:skills\/ds(?:-[a-z]+)?\/SKILL\.md|commands\/ds(?:-[a-z]+)?\.(?:md|toml))$/;

/**
 * 이 레포에 dsmith MCP 서버가 등록돼 있는지, `/ds-*` 슬래시 명령·스킬이 설치돼 있는지 읽는다.
 * 근거: MCP 설정 파일(`.mcp.json` 등)의 `mcpServers.dsmith`와 Codex `config.toml`의 `[mcp_servers.dsmith]`,
 * 설치 매니페스트(`.dsmith/install.json`)의 스킬·명령 항목 중 디스크에 있는 파일, `.claude/skills/ds*` 폴더.
 * 홈(`--global`) 설치는 보지 않는다 — AGENTS.md는 레포 파일이다.
 */
export async function detectInstalledSurfaces(root: string): Promise<InstalledSurfaces> {
  const mcp =
    (await jsonHasDsmith(path.join(root, ".mcp.json"))) ||
    (await jsonHasDsmith(path.join(root, ".cursor", "mcp.json"))) ||
    (await jsonHasDsmith(path.join(root, ".gemini", "settings.json"))) ||
    /\[mcp_servers\.dsmith\]/.test((await readText(path.join(root, ".codex", "config.toml"))) ?? "");

  let skills = false;
  const manifest = await readText(path.join(root, ".dsmith", "install.json"));
  if (manifest !== null) {
    try {
      const entries = (JSON.parse(manifest) as { entries?: Record<string, unknown> } | null)?.entries ?? {};
      for (const key of Object.keys(entries)) {
        const file = key.split("#")[0] ?? "";
        if (SKILL_FILE.test(file) && !path.isAbsolute(file) && (await exists(path.join(root, file)))) {
          skills = true;
          break;
        }
      }
    } catch {
      // 읽을 수 없는 매니페스트는 install이 따로 알린다 — 여기서는 없는 것으로 본다
    }
  }
  if (!skills) skills = await exists(path.join(root, ".claude", "skills", "ds", "SKILL.md"));
  return { mcp, skills };
}
