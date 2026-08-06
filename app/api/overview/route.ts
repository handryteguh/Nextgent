import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const HERMES_BIN = "hermes";
const PROFILES = ["nexgent", "default", "devsandbox"];

type SessionInfo = {
  id: string;
  title: string | null;
  startedAt: string | null;
  lastActive: string | null;
  messageCount: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  costUsd: number | null;
  lastUserPrompt: string | null;
  model: string | null;
};

type AgentInfo = {
  name: string;
  gateway: "running" | "stopped" | "unknown";
  gatewayPid: number | null;
  sessionCount: number;
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalReasoningTokens: number;
  totalCostUsd: number;
  lastSession: SessionInfo | null;
  lastTask: { prompt: string; sessionId: string; when: string } | null;
};

async function run(args: string[], timeout = 30_000): Promise<string> {
  try {
    const { stdout } = await execFileAsync(HERMES_BIN, args, {
      timeout,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout;
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return err.stdout ?? err.stderr ?? "";
  }
}

function parseSessionsJsonl(raw: string): SessionInfo[] {
  const sessions: SessionInfo[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (!obj.id || obj.type === "message") continue;
      const msgArr: Array<{ role?: string; content?: unknown }> = Array.isArray(obj.messages)
        ? obj.messages
        : [];
      const lastUser = msgArr
        .filter((m) => m?.role === "user")
        .slice(-1)[0];
      let lastPrompt: string | null = null;
      if (lastUser) {
        const c = lastUser.content;
        if (typeof c === "string") lastPrompt = c;
        else if (Array.isArray(c)) {
          lastPrompt = c
            .map((p) => (typeof p === "string" ? p : p?.text ?? ""))
            .join(" ")
            .trim() || null;
        }
      }
      sessions.push({
        id: obj.id,
        title: obj.title ?? null,
        startedAt: obj.started_at ?? null,
        lastActive: obj.ended_at ?? obj.started_at ?? null,
        messageCount: obj.message_count ?? 0,
        toolCalls: obj.tool_call_count ?? 0,
        inputTokens: obj.input_tokens ?? 0,
        outputTokens: obj.output_tokens ?? 0,
        cacheReadTokens: obj.cache_read_tokens ?? 0,
        reasoningTokens: obj.reasoning_tokens ?? 0,
        costUsd:
          typeof obj.estimated_cost_usd === "number" ? obj.estimated_cost_usd : null,
        lastUserPrompt: lastPrompt,
        model: obj.model ?? null,
      });
    } catch {
      /* skip bad line */
    }
  }
  return sessions;
}

export async function GET() {
  const result: {
    ok: boolean;
    generatedAt: string;
    cron: { enabled: boolean; count: number; jobs: unknown[] };
    agents: AgentInfo[];
  } = {
    ok: true,
    generatedAt: new Date().toISOString(),
    cron: { enabled: false, count: 0, jobs: [] },
    agents: [],
  };

  // Gateway status per profile
  const gatewayOut = await run(["gateway", "list"]);
  const gatewayMap: Record<string, { running: boolean; pid: number | null }> = {};
  for (const line of gatewayOut.split("\n")) {
    const m = line.match(/([✓✗])\s+(\S+)\s+.*?(?:PID (\d+)|not running|—)/);
    if (m) {
      const name = m[2].replace(/\(current\)/, "").trim();
      gatewayMap[name] = {
        running: m[1] === "✓",
        pid: m[3] ? parseInt(m[3], 10) : null,
      };
    }
  }

  // Cron status
  const cronOut = await run(["cron", "list"]);
  const cronMatch = cronOut.match(/No scheduled jobs\./i);
  const jobs = cronMatch ? [] : parseCronLines(cronOut);
  result.cron = {
    enabled: jobs.length > 0,
    count: jobs.length,
    jobs,
  };

  // Per-profile session data
  for (const profile of PROFILES) {
    const agent: AgentInfo = {
      name: profile,
      gateway: gatewayMap[profile]?.running ? "running" : "stopped",
      gatewayPid: gatewayMap[profile]?.pid ?? null,
      sessionCount: 0,
      totalMessages: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalReasoningTokens: 0,
      totalCostUsd: 0,
      lastSession: null,
      lastTask: null,
    };

    // Export all sessions for this profile (JSONL includes token usage)
    const out = await run(["sessions", "export", "-p", profile, "--format", "jsonl", "-"], 60_000);
    const sessions = parseSessionsJsonl(out).sort((a, b) => {
      const ta = typeof a.lastActive === "number" ? a.lastActive : 0;
      const tb = typeof b.lastActive === "number" ? b.lastActive : 0;
      return tb - ta;
    });

    agent.sessionCount = sessions.length;
    for (const s of sessions) {
      agent.totalMessages += s.messageCount;
      agent.totalInputTokens += s.inputTokens;
      agent.totalOutputTokens += s.outputTokens;
      agent.totalCacheReadTokens += s.cacheReadTokens;
      agent.totalReasoningTokens += s.reasoningTokens;
      agent.totalCostUsd += s.costUsd ?? 0;
    }
    agent.lastSession = sessions[0] ?? null;
    if (agent.lastSession) {
      agent.lastTask = {
        prompt: agent.lastSession.lastUserPrompt ?? "(tanpa prompt)",
        sessionId: agent.lastSession.id,
        when: agent.lastSession.lastActive ?? "",
      };
    }

    result.agents.push(agent);
  }

  return NextResponse.json(result);
}

function parseCronLines(raw: string): unknown[] {
  const jobs: unknown[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([0-9a-f-]{6,})\s+(.+)$/);
    if (m) {
      jobs.push({ id: m[1], desc: m[2].trim() });
    }
  }
  return jobs;
}
