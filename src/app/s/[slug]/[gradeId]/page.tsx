import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, kits, kitItems, skus } from "@/db/schema";
import Configurator from "./configurator";

export default async function KitConfiguratorPage({
  params,
}: {
  params: Promise<{ slug: string; gradeId: string }>;
}) {
  const { slug, gradeId } = await params;
  const gradeIdNum = Number(gradeId);
  if (!gradeIdNum) notFound();

  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.referralSlug, slug)).limit(1);
  if (!school || school.status !== "active") notFound();

  const [grade] = await db.select().from(grades).where(eq(grades.id, gradeIdNum)).limit(1);
  if (!grade || grade.schoolId !== school.id) notFound();

  const [kit] = await db
    .select()
    .from(kits)
    .where(and(eq(kits.schoolId, school.id), eq(kits.gradeId, gradeIdNum), eq(kits.status, "live")))
    .orderBy(desc(kits.updatedAt))
    .limit(1);
  if (!kit) notFound();

  const rows = await db
    .select({ item: kitItems, sku: skus })
    .from(kitItems)
    .innerJoin(skus, eq(kitItems.skuId, skus.id))
    .where(eq(kitItems.kitId, kit.id))
    .orderBy(asc(kitItems.sortOrder), asc(kitItems.id));

  const items = rows
    .filter(({ item }) => item.qty !== null)
    .map(({ item, sku }) => ({
      id: item.id,
      skuName: sku.name,
      skuBrand: sku.brand,
      category: sku.category,
      subject: item.subject ?? "General",
      qty: item.qty as number,
      unitPrice: item.unitPrice,
      lineTotal: item.qty! * item.unitPrice,
      isOptional: item.isOptional,
    }));

  return (
    <Configurator
      kitId={kit.id}
      schoolName={school.name}
      gradeLabel={grade.label}
      kitName={kit.name}
      labelingAvailable={kit.labelingAvailable}
      items={items}
    />
  );
}
