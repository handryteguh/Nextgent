import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const HERMES_BIN = "hermes";
const PROFILE = process.env.NEXGENT_PROFILE || "nexgent";

export async function GET() {
  // Dashboard status: agent backend health + model info
  try {
    const [healthRes, modelRes] = await Promise.all([
      fetch("http://127.0.0.1:9119/api/health", { signal: AbortSignal.timeout(4000) }),
      fetch("http://127.0.0.1:9119/api/model/info", { signal: AbortSignal.timeout(4000) }),
    ]);

    const health = healthRes.ok ? await healthRes.json() : { ok: false };
    const model = modelRes.ok ? await modelRes.json() : null;

    return NextResponse.json({
      ok: true,
      hermes: {
        version: health.version ?? null,
        auth_required: health.auth_required ?? null,
        model: model?.model ?? null,
        provider: model?.provider ?? null,
        context_length: model?.effective_context_length ?? null,
        backend: healthRes.ok ? "online" : "offline",
      },
    });
  } catch (e) {
    return NextResponse.json({
      ok: true,
      hermes: {
        version: null,
        backend: "offline",
        error: (e as Error).message,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  // Run an agent task via `hermes chat -q`
  let body: { prompt?: string; sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt kosong" }, { status: 400 });
  }

  const startedAt = Date.now();

  const args = ["chat", "-q", prompt, "-p", PROFILE];
  if (body.sessionId) {
    args.push("--resume", body.sessionId);
  }

  try {
    const { stdout } = await execFileAsync(HERMES_BIN, args, {
      timeout: 90_000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });

    // Parse the summary block hermes prints at the end (Session/Duration/Messages)
    const summaryMatch = stdout.match(/Session:\s+(\S+)/);
    const sessionId = summaryMatch?.[1] ?? null;

    const durationMatch = stdout.match(/Duration:\s+([\d.]+)s/);
    const duration = durationMatch ? parseFloat(durationMatch[1]) : null;

    // Strip the leading resume hint line if present
    const clean = stdout.replace(/^hermes --resume\s+\S+\s+-p\s+\S+\r?\n/, "").trim();

    return NextResponse.json({
      ok: true,
      output: clean,
      sessionId,
      durationSec: duration ?? Math.round((Date.now() - startedAt) / 1000),
    });
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string; message?: string };
    const stderr = err.stderr ?? "";
    const stdout = err.stdout ?? "";
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Unknown error",
        output: (stdout || stderr || "").trim().slice(-2000),
        durationSec: Math.round((Date.now() - startedAt) / 1000),
      },
      { status: 500 }
    );
  }
}
