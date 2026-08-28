import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followupJobs, sequenceSteps } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

// POST /api/followup-jobs/[id]/actions
// Body: { action: "skip" | "snooze" | "stop" | "pause" | "resume", snoozeHours?: number }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = db.select().from(followupJobs).where(eq(followupJobs.id, Number(id))).get();
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const action = body?.action as string;
  const now = Date.now();

  switch (action) {
    case "skip": {
      // Lewati step sekarang → maju ke step berikutnya
      const nextStep = job.currentStep + 1;
      const nextStepRow = db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, job.sequenceId))
        .orderBy(sql`"order" ASC`)
        .all()[nextStep];

      if (!nextStepRow) {
        // Gak ada step berikutnya → selesai
        const [updated] = await db
          .update(followupJobs)
          .set({ status: "completed", currentStep: nextStep, nextSendAt: null, updatedAt: now })
          .where(eq(followupJobs.id, job.id))
          .returning();
        return NextResponse.json({ data: updated, message: "Sequence selesai (step terakhir di-skip)" });
      }

      const nextSendAt = now + nextStepRow.delayHours * 60 * 60 * 1000;
      const [updated] = await db
        .update(followupJobs)
        .set({ currentStep: nextStep, nextSendAt, updatedAt: now })
        .where(eq(followupJobs.id, job.id))
        .returning();
      return NextResponse.json({ data: updated, message: `Step di-skip, lanjut ke step ${nextStep + 1}` });
    }

    case "snooze": {
      // Tunda pengiriman step sekarang
      const snoozeHours = Number(body?.snoozeHours ?? 24);
      if (snoozeHours < 1 || snoozeHours > 168)
        return NextResponse.json({ error: "snoozeHours harus antara 1–168" }, { status: 400 });

      const nextSendAt = (job.nextSendAt ?? now) + snoozeHours * 60 * 60 * 1000;
      const [updated] = await db
        .update(followupJobs)
        .set({ nextSendAt, updatedAt: now })
        .where(eq(followupJobs.id, job.id))
        .returning();
      return NextResponse.json({ data: updated, message: `Ditunda ${snoozeHours} jam` });
    }

    case "stop": {
      const [updated] = await db
        .update(followupJobs)
        .set({ status: "stopped", stoppedReason: "manual", nextSendAt: null, updatedAt: now })
        .where(eq(followupJobs.id, job.id))
        .returning();
      return NextResponse.json({ data: updated, message: "Sequence dihentikan manual" });
    }

    case "pause": {
      if (job.status !== "active")
        return NextResponse.json({ error: "Hanya job aktif yang bisa di-pause" }, { status: 400 });
      const [updated] = await db
        .update(followupJobs)
        .set({ status: "paused", updatedAt: now })
        .where(eq(followupJobs.id, job.id))
        .returning();
      return NextResponse.json({ data: updated, message: "Sequence di-pause" });
    }

    case "resume": {
      if (job.status !== "paused")
        return NextResponse.json({ error: "Hanya job paused yang bisa di-resume" }, { status: 400 });
      const [updated] = await db
        .update(followupJobs)
        .set({ status: "active", updatedAt: now })
        .where(eq(followupJobs.id, job.id))
        .returning();
      return NextResponse.json({ data: updated, message: "Sequence dilanjutkan" });
    }

    default:
      return NextResponse.json(
        { error: "Action tidak valid. Pilihan: skip | snooze | stop | pause | resume" },
        { status: 400 }
      );
  }
}
