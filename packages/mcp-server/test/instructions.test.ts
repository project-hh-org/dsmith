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
    expect(DS_RULE_LINE).toBe(
      "새 UI 코드는 AGENTS.md의 DS 규칙(디자인 토큰·DS 컴포넌트)을 따른다. 이 도구는 그 규칙에 맞는 토큰·컴포넌트를 찾을 때 쓴다.",
    );
    // 모든 레포에서 참인 문구: 특정 스타일링 방식(CSS 변수·Tailwind 프리셋)을 전제하지 않는다
    expect(DS_RULE_LINE).not.toContain("var(--");
    expect(DS_RULE_LINE).not.toContain("ds-");
    expect(DS_RULE_LINE).not.toContain("Tailwind");
    expect(DS_RULE_LINE).not.toContain("\n");
    expect(estimateTokens(DS_RULE_LINE)).toBeLessThanOrEqual(60);
  });

  it("서버 instructions가 규칙 한 줄이다", async () => {
    const client = await open();
    expect(client.getInstructions()).toBe(DS_RULE_LINE);
  });

  it("규칙 줄은 값을 찾아 주는 세 도구(resolve_token·search_component·get_component)의 설명에만 붙고 도구 이름은 그대로다", async () => {
    const client = await open();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    const withRule = tools.filter((t) => t.description?.startsWith(`${DS_RULE_LINE}\n`)).map((t) => t.name);
    expect(withRule.sort()).toEqual(["get_component", "resolve_token", "search_component"]);
    for (const t of tools) if (!withRule.includes(t.name)) expect(t.description, t.name).not.toContain("AGENTS.md");
  });

  it("tools/list 설명(instructions 포함)의 총 크기는 이전(규칙 줄을 도구 6개에 모두 붙이던 때) 추정 1114 토큰 + 150을 넘지 않는다", async () => {
    const client = await open();
    const { tools } = await client.listTools();
    const total = estimateTokens(client.getInstructions() ?? "") + tools.reduce((n, t) => n + estimateTokens(t.description ?? ""), 0);
    expect(total).toBeLessThanOrEqual(1114 + 150);
  });
});
