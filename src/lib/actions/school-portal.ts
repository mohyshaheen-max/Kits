"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { listUpdateRequests } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";

export async function requestListUpdateAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const schoolAdmin = await requireSchoolPortal();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Tell us what needs to change." };

  const gradeIdRaw = String(formData.get("grade_id") ?? "").trim();
  const gradeId = gradeIdRaw ? Number(gradeIdRaw) : null;

  const db = getDb();
  await db.insert(listUpdateRequests).values({
    schoolId: schoolAdmin.schoolId,
    gradeId,
    note,
  });

  revalidatePath("/portal/request");
  return { ok: true };
}
