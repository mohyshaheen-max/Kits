export function generateOrderNumber(): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const suffix = crypto.getRandomValues(new Uint8Array(3));
  const suffixStr = Array.from(suffix)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 5);
  return `KITS-${stamp}-${suffixStr}`;
}
