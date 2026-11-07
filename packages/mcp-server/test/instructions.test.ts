import fs from "node:fs";
import type { Client } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it } from "vitest";
import { estimateTokens } from "../src/budget.js";
import { DS_RULE_LINE, TOOL_NAMES } from "../src/index.js";
import { WITH_DS_TOKENS_CSS, connect, copyFixture, indexFixture } from "./helpers.js";

const clients: Client[] = [];
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map((c) => c.close()));
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

async function open(): Promise<Client> {
  const root = copyFixture("fixtures/with-ds-app", { "components/ui/tokens.css": WITH_DS_TOKENS_CSS });
  dirs.push(root);
  await indexFixture(root);
  const client = await connect({ root });
  clients.push(client);
  return client;
}

describe("AGENTS.md DS 규칙을 앞세우는 문구", () => {
  it("규칙 한 줄은 AGENTS.md의 DS 규칙을 따르라고 하고 도구를 값 찾기용으로 한정한다", () => {
    expect(DS_RULE_LINE).toContain("AGENTS.md의 DS 규칙");
    expect(DS_RULE_LINE).toContain("var(--");
    expect(DS_RULE_LINE).toContain("ds-");
    expect(DS_RULE_LINE).not.toContain("\n");
    expect(estimateTokens(DS_RULE_LINE)).toBeLessThanOrEqual(80);
  });

  it("서버 instructions가 규칙 한 줄로 시작한다", async () => {
    const client = await open();
    expect(client.getInstructions()?.startsWith(DS_RULE_LINE)).toBe(true);
  });

  it("모든 도구 설명이 규칙 한 줄로 시작하고 도구 이름은 그대로다", async () => {
    const client = await open();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const t of tools) expect(t.description?.startsWith(`${DS_RULE_LINE}\n`), t.name).toBe(true);
  });
});
