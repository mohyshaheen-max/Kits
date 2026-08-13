// Subject colours are recessive — a 3px bar or 8px dot only, per DESIGN.md.
// Unmapped/general subjects fall back to the neutral line colour rather
// than inventing a colour that isn't in the token set.
const SUBJECT_COLORS: Record<string, string> = {
  english: "var(--subj-english)",
  maths: "var(--subj-maths)",
  math: "var(--subj-maths)",
  science: "var(--subj-science)",
  humanities: "var(--subj-humanities)",
  arabic: "var(--subj-language)",
  language: "var(--subj-language)",
  religion: "var(--subj-religion)",
  art: "var(--subj-arts)",
  arts: "var(--subj-arts)",
  ict: "var(--subj-ict)",
};

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject.trim().toLowerCase()] ?? "var(--line)";
}
