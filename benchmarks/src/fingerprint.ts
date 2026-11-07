import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { sha256Text } from "@dsmith-dev/core";
import { CLI_BIN } from "./base.js";
import type { SetupFingerprint } from "./model.js";

const DS_SECTION = /<!-- dsmith:(?:ds:)?start -->[\s\S]*?<!-- dsmith:(?:ds:)?end -->\n?/g;

async function readOrNull(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

/** `.mcp.json`에서 절대 경로(워크트리·홈 위치)를 `<abs>/이름`으로 바꿔, 빌드 위치가 달라도 같은 설정이면 같은 문자열이 되게 한다 */
export function normalizeMcpConfig(text: string): string {
  const norm = (v: unknown): unknown => {
    if (typeof v === "string") return path.isAbsolute(v) ? `<abs>/${path.basename(v)}` : v;
    if (Array.isArray(v)) return v.map(norm);
    if (typeof v === "object" && v !== null) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)]));
    return v;
  };
  return JSON.stringify(norm(JSON.parse(text)));
}

async function listFilesSorted(root: string, rel = ""): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const r = rel === "" ? e.name : `${rel}/${e.name}`;
    if (e.isDirectory()) out.push(...(await listFilesSorted(root, r)));
    else out.push(r);
  }
  return out.sort();
}

/** 복사본의 `.mcp.json`이 가리키는 서버와 같은 빌드(CLI_BIN)를 복사본 root에서 띄워 instructions·tools/list(이름·설명)를 읽는다 */
async function readMcpSurface(dir: string): Promise<string> {
  const transport = new StdioClientTransport({ command: process.execPath, args: [CLI_BIN, "mcp", "--root", dir, "--no-git"], stderr: "ignore" });
  const client = new Client({ name: "dsmith-bench-fingerprint", version: "0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const sorted = tools.map((t) => ({ name: t.name, description: t.description ?? "" })).sort((a, b) => (a.name < b.name ? -1 : 1));
    return JSON.stringify({ instructions: client.getInstructions() ?? "", tools: sorted });
  } finally {
    await client.close();
  }
}

/** 조건 복사본의 dsmith 영향 파일 지문. `.mcp.json`이 있을 때만 MCP 서버를 한 번 띄운다 */
export async function fingerprintCondition(dir: string): Promise<SetupFingerprint> {
  const agents = await readOrNull(path.join(dir, "AGENTS.md"));
  const sections = agents === null ? [] : (agents.match(DS_SECTION) ?? []);
  const agentsSection = sections.length === 0 ? null : sha256Text(sections.join(""));

  const mcp = await readOrNull(path.join(dir, ".mcp.json"));
  const mcpConfig = mcp === null ? null : sha256Text(normalizeMcpConfig(mcp));
  const mcpTools = mcp === null ? null : sha256Text(await readMcpSurface(dir));

  const skillFiles = await listFilesSorted(dir, ".claude/skills");
  let skills: string | null = null;
  if (skillFiles.length > 0) {
    const parts: string[] = [];
    for (const f of skillFiles) parts.push(`${f}\n${await fs.readFile(path.join(dir, f), "utf-8")}`);
    skills = sha256Text(parts.join("\n\0\n"));
  }

  const all = sha256Text(JSON.stringify({ agentsSection, mcpConfig, skills, mcpTools }));
  return { agentsSection, mcpConfig, skills, mcpTools, all };
}
