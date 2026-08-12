const ICONS: Record<string, string> = {
  Copybook: "📓",
  Notebook: "📔",
  File: "🗂️",
  Glue: "🧴",
  Paint: "🎨",
  Playdough: "🟠",
  Plasticine: "🟢",
  Calculator: "🧮",
  Pencil: "✏️",
  Pen: "🖊️",
  Eraser: "🩹",
  Sharpener: "🔧",
  Ruler: "📏",
  Scissors: "✂️",
  Crayons: "🖍️",
  Markers: "🖌️",
  Bag: "🎒",
  "Pencil case": "🧳",
  Hygiene: "🧻",
  Stationery: "📎",
};

export function categoryIcon(category: string): string {
  return ICONS[category] ?? "📦";
}
