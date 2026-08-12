import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { grades } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";
import RequestForm from "./request-form";

export const dynamic = "force-dynamic";

export default async function PortalRequestPage() {
  const schoolAdmin = await requireSchoolPortal();
  const db = getDb();
  const schoolGrades = await db
    .select()
    .from(grades)
    .where(eq(grades.schoolId, schoolAdmin.schoolId))
    .orderBy(asc(grades.sortOrder));

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-neutral-900">Request a list update</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tell us what needs to change for next year — a new item, a quantity change, a brand switch. Your KITS contact
        will follow up before anything goes live.
      </p>
      <RequestForm grades={schoolGrades.map((g) => ({ id: g.id, label: g.label }))} />
    </div>
  );
}
