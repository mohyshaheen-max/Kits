import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { schoolAdmins } from "@/db/schema";
import { SCHOOL_SESSION_COOKIE, SESSION_TTL_SECONDS, signSchoolSession, verifySchoolSession } from "@/lib/auth";

async function authSecret(): Promise<string> {
  const { env } = getCloudflareContext();
  return env.AUTH_SECRET;
}

export async function createSchoolSession(schoolAdminId: number) {
  const secret = await authSecret();
  const value = await signSchoolSession(schoolAdminId, secret);
  const store = await cookies();
  store.set(SCHOOL_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySchoolSession() {
  const store = await cookies();
  store.delete(SCHOOL_SESSION_COOKIE);
}

export async function getCurrentSchoolAdmin() {
  const store = await cookies();
  const cookie = store.get(SCHOOL_SESSION_COOKIE)?.value;
  if (!cookie) return null;
  const secret = await authSecret();
  const session = await verifySchoolSession(cookie, secret);
  if (!session) return null;
  const db = getDb();
  const [schoolAdmin] = await db.select().from(schoolAdmins).where(eq(schoolAdmins.id, session.schoolAdminId)).limit(1);
  return schoolAdmin ?? null;
}

export async function requireSchoolPortal() {
  const schoolAdmin = await getCurrentSchoolAdmin();
  if (!schoolAdmin) redirect("/portal/login");
  return schoolAdmin;
}
