// Generates seed-data.sql from structured fixture data below. Deliberately
// NOT written into drizzle/ — that folder is scanned by `wrangler d1
// migrations apply` and a seed file dropped in there gets replayed as if it
// were a schema migration.
// Run: npx tsx scripts/seed.ts && npx wrangler d1 execute DB --local --file=seed-data.sql
import { writeFileSync } from "node:fs";
import { hashPassword } from "../src/lib/auth";

function val(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function insert(table: string, row: Record<string, string | number | boolean | null | undefined>): string {
  const cols = Object.keys(row);
  const vals = cols.map((c) => val(row[c]));
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")});`;
}

const schoolSub = (name: string) => `(SELECT id FROM schools WHERE name = ${val(name)})`;
const gradeSub = (school: string, label: string) =>
  `(SELECT id FROM grades WHERE school_id = ${schoolSub(school)} AND label = ${val(label)})`;
const skuSub = (code: string) => `(SELECT id FROM skus WHERE code = ${val(code)})`;
const listSub = (school: string, label: string, year: string) =>
  `(SELECT id FROM school_lists WHERE school_id = ${schoolSub(school)} AND grade_id = ${gradeSub(
    school,
    label
  )} AND academic_year = ${val(year)})`;

// Raw insert with column expressions that include subqueries (val() can't
// escape a raw SQL fragment, so this variant takes pre-built value strings).
function insertRaw(table: string, row: Record<string, string>): string {
  const cols = Object.keys(row);
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => row[c]).join(", ")});`;
}

async function main() {
  const lines: string[] = [];

  // ---- admin -----------------------------------------------------------
  const passwordHash = await hashPassword("ChangeMe123!");
  lines.push(
    insert("admins", {
      email: "mohy.shaheen@gmail.com",
      password_hash: passwordHash,
      name: "Mohy Shaheen",
    })
  );

  // ---- schools -----------------------------------------------------------
  const schools = [
    {
      name: "Al Hoda Language School",
      name_ar: "مدرسة الهدى",
      tier: "A",
      district: "Nasr City",
      contact_name: "Mona Adel",
      contact_phone: "+20 100 111 2222",
      contact_email: "mona@alhoda.example.edu.eg",
      referral_slug: "al-hoda",
    },
    {
      name: "Metropolitan International School",
      name_ar: "المدرسة المتروبوليتان",
      tier: "A",
      district: "6th of October",
      contact_name: "Sara Fathy",
      contact_phone: "+20 100 333 4444",
      contact_email: "sara@metropolitan.example.edu.eg",
      referral_slug: "metropolitan",
    },
    {
      name: "Elite International School",
      name_ar: "مدرسة النخبة",
      tier: "B",
      district: "New Cairo",
      contact_name: "Karim Nabil",
      contact_phone: "+20 100 555 6666",
      contact_email: "karim@elite.example.edu.eg",
      referral_slug: "elite",
    },
  ];
  for (const s of schools) lines.push(insert("schools", s));

  // ---- grades -----------------------------------------------------------
  const grades: { school: string; label: string; sort: number; curriculum: string }[] = [
    { school: "Al Hoda Language School", label: "KG1", sort: 1, curriculum: "National" },
    { school: "Al Hoda Language School", label: "KG2", sort: 2, curriculum: "National" },
    { school: "Al Hoda Language School", label: "Year 3", sort: 5, curriculum: "National" },
    { school: "Al Hoda Language School", label: "Year 4", sort: 6, curriculum: "National" },
    { school: "Al Hoda Language School", label: "Year 6", sort: 8, curriculum: "National" },
    { school: "Al Hoda Language School", label: "Year 7", sort: 9, curriculum: "National" },
    { school: "Metropolitan International School", label: "Pre-K", sort: 0, curriculum: "British" },
    { school: "Metropolitan International School", label: "KG1", sort: 1, curriculum: "British" },
    { school: "Metropolitan International School", label: "KG2", sort: 2, curriculum: "British" },
    { school: "Metropolitan International School", label: "Year 1", sort: 3, curriculum: "British" },
    { school: "Elite International School", label: "KG1", sort: 1, curriculum: "American" },
    { school: "Elite International School", label: "Year 1", sort: 3, curriculum: "American" },
  ];
  for (const g of grades) {
    lines.push(
      insertRaw("grades", {
        school_id: schoolSub(g.school),
        label: val(g.label),
        sort_order: val(g.sort),
        curriculum: val(g.curriculum),
        active: val(true),
      })
    );
  }

  // ---- SKU catalogue ------------------------------------------------------
  type Sku = {
    code: string;
    name: string;
    category: string;
    spec?: string;
    size?: string;
    colour?: string;
    brand?: string;
    tier: "GEN" | "BRAND" | "ANY";
    cost: number;
    price: number;
  };
  const skus: Sku[] = [
    { code: "COPY-40-SQ", name: "Copybook 40pg, squared", category: "Copybook", spec: "squared ruling", size: "40pg", tier: "GEN", cost: 6, price: 12 },
    { code: "COPY-80-SQ", name: "Copybook 80pg, squared", category: "Copybook", spec: "squared ruling", size: "80pg", tier: "GEN", cost: 10, price: 18 },
    { code: "COPY-40-LINE", name: "Copybook 40pg, lined", category: "Copybook", spec: "lined ruling", size: "40pg", tier: "GEN", cost: 6, price: 12 },
    { code: "COPY-100-LINE", name: "Copybook 100pg, lined", category: "Copybook", spec: "lined ruling", size: "100pg", tier: "GEN", cost: 12, price: 22 },
    { code: "NB-A4-SPIRAL", name: "Spiral notebook A4", category: "Notebook", size: "A4", tier: "GEN", cost: 15, price: 28 },
    { code: "NB-A5-SPIRAL", name: "Spiral notebook A5", category: "Notebook", size: "A5", tier: "GEN", cost: 10, price: 20 },
    { code: "FILE-ZIP-A4-RED", name: "Zipper file A4, red", category: "File", size: "A4", colour: "Red", tier: "ANY", cost: 14, price: 25 },
    { code: "FILE-ZIP-A4-BLUE", name: "Zipper file A4, blue", category: "File", size: "A4", colour: "Blue", tier: "ANY", cost: 14, price: 25 },
    { code: "FILE-RING-A4", name: "Ring binder file A4", category: "File", size: "A4", tier: "GEN", cost: 18, price: 32 },
    { code: "GLUE-STICK-PRITT", name: "Glue stick, Pritt", category: "Glue", brand: "Pritt", tier: "BRAND", cost: 20, price: 35 },
    { code: "GLUE-STICK-UHU", name: "Glue stick, UHU", category: "Glue", brand: "UHU", tier: "BRAND", cost: 19, price: 34 },
    { code: "GLUE-STICK-GENERIC", name: "Glue stick, generic", category: "Glue", brand: "NoName", tier: "BRAND", cost: 8, price: 15 },
    { code: "PAINT-POSTER-JOVI", name: "Poster paint set, Jovi", category: "Paint", brand: "Jovi", tier: "BRAND", cost: 45, price: 75 },
    { code: "PAINT-POSTER-NOVA", name: "Poster paint set, Nova", category: "Paint", brand: "Nova", tier: "BRAND", cost: 40, price: 68 },
    { code: "PAINT-POSTER-GENERIC", name: "Poster paint set, ColorMax", category: "Paint", brand: "ColorMax", tier: "BRAND", cost: 30, price: 52 },
    { code: "PLAYDOUGH-NOVA", name: "Playdough set, Nova", category: "Playdough", brand: "Nova", tier: "BRAND", cost: 22, price: 38 },
    { code: "PLAYDOUGH-JOVI", name: "Playdough set, Jovi", category: "Playdough", brand: "Jovi", tier: "BRAND", cost: 24, price: 40 },
    { code: "PLAYDOUGH-GENERIC", name: "Playdough set, ColorMax", category: "Playdough", brand: "ColorMax", tier: "BRAND", cost: 15, price: 28 },
    { code: "PLASTICINE-JOVI", name: "Plasticine set, Jovi", category: "Plasticine", brand: "Jovi", tier: "BRAND", cost: 26, price: 44 },
    { code: "PLASTICINE-GENERIC", name: "Plasticine set, ColorMax", category: "Plasticine", brand: "ColorMax", tier: "BRAND", cost: 16, price: 29 },
    { code: "CALC-CASIO-FX991ESPLUS", name: "Scientific calculator, Casio fx-991ES Plus", category: "Calculator", brand: "Casio", spec: "fx-991ES Plus", tier: "BRAND", cost: 380, price: 520 },
    { code: "CALC-GENERIC-SCI", name: "Scientific calculator, Citizen", category: "Calculator", brand: "Citizen", tier: "BRAND", cost: 220, price: 340 },
    { code: "PENCIL-HB-2", name: "HB pencil", category: "Pencil", tier: "GEN", cost: 2, price: 4 },
    { code: "PENCIL-COLOUR-12", name: "Colour pencils, 12", category: "Pencil", size: "12pk", tier: "GEN", cost: 18, price: 32 },
    { code: "PENCIL-COLOUR-24", name: "Colour pencils, 24", category: "Pencil", size: "24pk", tier: "GEN", cost: 32, price: 55 },
    { code: "PEN-BLUE-BALLPOINT", name: "Ballpoint pen, blue", category: "Pen", colour: "Blue", tier: "GEN", cost: 3, price: 6 },
    { code: "PEN-BLACK-BALLPOINT", name: "Ballpoint pen, black", category: "Pen", colour: "Black", tier: "GEN", cost: 3, price: 6 },
    { code: "PEN-RED-BALLPOINT", name: "Ballpoint pen, red", category: "Pen", colour: "Red", tier: "GEN", cost: 3, price: 6 },
    { code: "ERASER-WHITE", name: "White eraser", category: "Eraser", tier: "GEN", cost: 2, price: 4 },
    { code: "SHARPENER-SINGLE", name: "Single hole sharpener", category: "Sharpener", tier: "GEN", cost: 3, price: 6 },
    { code: "RULER-30CM", name: "Ruler, 30cm", category: "Ruler", size: "30cm", tier: "GEN", cost: 5, price: 10 },
    { code: "SCISSORS-KIDS", name: "Kids safety scissors", category: "Scissors", tier: "GEN", cost: 12, price: 22 },
    { code: "CRAYONS-12", name: "Wax crayons, 12", category: "Crayons", size: "12pk", tier: "GEN", cost: 14, price: 25 },
    { code: "CRAYONS-24", name: "Wax crayons, 24", category: "Crayons", size: "24pk", tier: "GEN", cost: 24, price: 42 },
    { code: "MARKERS-12-WASHABLE", name: "Washable markers, 12", category: "Markers", size: "12pk", tier: "GEN", cost: 22, price: 38 },
    { code: "SCHOOLBAG-STD", name: "School bag, standard", category: "Bag", tier: "GEN", cost: 180, price: 280 },
    { code: "PENCILCASE-STD", name: "Pencil case, standard", category: "Pencil case", tier: "GEN", cost: 25, price: 45 },
    { code: "TISSUE-BOX", name: "Facial tissue box", category: "Hygiene", tier: "GEN", cost: 8, price: 14 },
    { code: "WETWIPES-PACK", name: "Wet wipes pack", category: "Hygiene", tier: "GEN", cost: 10, price: 18 },
    { code: "STICKYNOTES-PACK", name: "Sticky notes pack", category: "Stationery", tier: "GEN", cost: 9, price: 16 },
    { code: "HIGHLIGHTERS-4", name: "Highlighters, 4 colours", category: "Markers", size: "4pk", tier: "GEN", cost: 16, price: 28 },
    { code: "WBMARKER-4", name: "Whiteboard markers, 4 colours", category: "Markers", size: "4pk", tier: "GEN", cost: 20, price: 34 },
  ];
  for (const s of skus) {
    lines.push(
      insert("skus", {
        code: s.code,
        name: s.name,
        category: s.category,
        spec: s.spec ?? null,
        size: s.size ?? null,
        colour: s.colour ?? null,
        brand: s.brand ?? null,
        tier: s.tier,
        unit_cost: s.cost,
        unit_price: s.price,
        active: true,
      })
    );
  }

  // ---- brand rules --------------------------------------------------------
  const brandRules: { school: string; category: string; brand: string; rule: "REQUIRE" | "FORBID"; note?: string }[] = [
    { school: "Metropolitan International School", category: "Paint", brand: "Jovi", rule: "FORBID", note: "KG1 — parents reported allergic reactions" },
    { school: "Metropolitan International School", category: "Playdough", brand: "Nova", rule: "FORBID", note: "Pre-K" },
    { school: "Elite International School", category: "Plasticine", brand: "Jovi", rule: "REQUIRE" },
    { school: "Al Hoda Language School", category: "Glue", brand: "Pritt", rule: "REQUIRE", note: "Pritt or UHU only — no substitution" },
    { school: "Al Hoda Language School", category: "Glue", brand: "UHU", rule: "REQUIRE", note: "Pritt or UHU only — no substitution" },
    { school: "Al Hoda Language School", category: "Calculator", brand: "Casio", rule: "REQUIRE", note: "Year 6 — exact model fx-991ES Plus only" },
  ];
  for (const r of brandRules) {
    lines.push(
      insertRaw("school_brand_rules", {
        school_id: schoolSub(r.school),
        sku_category: val(r.category),
        brand: val(r.brand),
        rule: val(r.rule),
        note: val(r.note ?? null),
      })
    );
  }

  // ---- school lists + items -------------------------------------------
  const YEAR = "2026/27";
  type ListDef = {
    school: string;
    grade: string;
    items: {
      sku?: string;
      raw?: string;
      qty?: number | null;
      subject?: string;
      optional?: boolean;
      excluded?: boolean;
      reason?: string;
      notes?: string;
    }[];
  };

  const lists: ListDef[] = [
    {
      school: "Al Hoda Language School",
      grade: "Year 3",
      items: [
        { sku: "COPY-40-SQ", qty: 4, subject: "Arabic" },
        { sku: "COPY-40-LINE", qty: 4, subject: "English" },
        { sku: "COPY-80-SQ", qty: 2, subject: "Maths" },
        { sku: "NB-A5-SPIRAL", qty: null, subject: "All subjects", notes: "'Notebooks for each subject' — no quantity given on the school list" },
        { sku: "FILE-ZIP-A4-BLUE", qty: 3, subject: "General" },
        { sku: "FILE-RING-A4", qty: 1, subject: "General" },
        { sku: "GLUE-STICK-PRITT", qty: 2, subject: "Art", notes: "School REQUIREs Pritt or UHU" },
        { sku: "PENCIL-HB-2", qty: 6, subject: "General" },
        { sku: "PENCIL-COLOUR-24", qty: 1, subject: "Art" },
        { sku: "ERASER-WHITE", qty: 2, subject: "General" },
        { sku: "SHARPENER-SINGLE", qty: 1, subject: "General" },
        { sku: "RULER-30CM", qty: 1, subject: "Maths" },
        { sku: "SCISSORS-KIDS", qty: 1, subject: "Art" },
        { sku: "CRAYONS-24", qty: 1, subject: "Art" },
        { raw: "Arabic Language Textbook (Nahdet Misr)", excluded: true, reason: "Textbook — bookshop supply chain, not stationery" },
        { raw: "Sujada (prayer rug)", excluded: true, reason: "Prayer garments/rugs — permanent exclusion category" },
        { raw: "Pencil case", excluded: true, reason: "Re-used — school list marks this item 'Re-used', do not purchase" },
      ],
    },
    {
      school: "Al Hoda Language School",
      grade: "Year 6",
      items: [
        { sku: "COPY-80-SQ", qty: 6, subject: "General" },
        { sku: "FILE-RING-A4", qty: 2, subject: "General" },
        { sku: "CALC-CASIO-FX991ESPLUS", qty: 1, subject: "Maths", notes: "School REQUIREs exact model — no substitution" },
        { sku: "PEN-BLUE-BALLPOINT", qty: 3, subject: "General" },
        { sku: "PEN-BLACK-BALLPOINT", qty: 2, subject: "General" },
        { sku: "HIGHLIGHTERS-4", qty: 1, subject: "General", optional: true },
        { raw: "Physics Textbook", excluded: true, reason: "Textbook — bookshop supply chain, not stationery" },
      ],
    },
    {
      school: "Metropolitan International School",
      grade: "Pre-K",
      items: [
        { sku: "COPY-40-SQ", qty: 2, subject: "General" },
        { sku: "NB-A4-SPIRAL", qty: null, subject: "General", notes: "School list says 'as needed' — no quantity given" },
        { sku: "FILE-ZIP-A4-RED", qty: 2, subject: "General" },
        { sku: "PAINT-POSTER-GENERIC", qty: 2, subject: "Art", notes: "Jovi is forbidden at this school — ColorMax used instead" },
        { sku: "PLAYDOUGH-GENERIC", qty: 2, subject: "Art", notes: "Nova is forbidden at this school (Pre-K) — ColorMax used instead" },
        { sku: "CRAYONS-12", qty: 1, subject: "Art" },
        { sku: "MARKERS-12-WASHABLE", qty: 1, subject: "Art" },
        { sku: "PENCIL-COLOUR-12", qty: 1, subject: "Art" },
        { sku: "SCISSORS-KIDS", qty: 1, subject: "Art" },
        { sku: "GLUE-STICK-UHU", qty: 2, subject: "Art" },
        { sku: "TISSUE-BOX", qty: 4, subject: "General", notes: "Consumable — replenished termly" },
        { sku: "WETWIPES-PACK", qty: 3, subject: "General" },
        { sku: "SCHOOLBAG-STD", qty: 1, subject: "General", optional: true },
        { sku: "PENCILCASE-STD", qty: 1, subject: "General", optional: true },
        { sku: "STICKYNOTES-PACK", qty: 1, subject: "General", optional: true },
        { raw: "Spare change of clothes", excluded: true, reason: "Clothing — permanent exclusion category" },
        { raw: "Family photo (4x6)", excluded: true, reason: "Photographs — permanent exclusion category" },
        { raw: "Water flask", excluded: true, reason: "Flasks/lunch boxes — permanent exclusion category" },
      ],
    },
    {
      school: "Elite International School",
      grade: "KG1",
      items: [
        { sku: "PLASTICINE-JOVI", qty: 2, subject: "Art", notes: "School REQUIREs Jovi" },
        { sku: "CRAYONS-12", qty: 1, subject: "Art" },
        { sku: "PENCIL-HB-2", qty: 2, subject: "General" },
        { sku: "ERASER-WHITE", qty: 1, subject: "General" },
        { sku: "FILE-RING-A4", qty: 1, subject: "General" },
        { raw: "iPad case", excluded: true, reason: "Personal electronic devices — permanent exclusion category" },
      ],
    },
  ];

  for (const list of lists) {
    lines.push(
      insertRaw("school_lists", {
        school_id: schoolSub(list.school),
        grade_id: gradeSub(list.school, list.grade),
        academic_year: val(YEAR),
        status: val("draft"),
      })
    );
    for (const item of list.items) {
      lines.push(
        insertRaw("list_items", {
          list_id: listSub(list.school, list.grade, YEAR),
          sku_id: item.sku ? skuSub(item.sku) : "NULL",
          raw_text: val(item.raw ?? null),
          qty: item.qty === undefined ? "NULL" : val(item.qty),
          subject: val(item.subject ?? null),
          is_optional: val(item.optional ?? false),
          is_excluded: val(item.excluded ?? false),
          exclusion_reason: val(item.reason ?? null),
          notes: val(item.notes ?? null),
        })
      );
    }
  }

  writeFileSync(new URL("../seed-data.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Wrote ${lines.length} statements to seed-data.sql`);
}

main();
