// D1 caps bound parameters per statement well under SQLite's own limit, so
// bulk inserts with many columns need to go in batches rather than one
// single multi-row INSERT.
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
