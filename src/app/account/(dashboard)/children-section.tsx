"use client";

import { useState } from "react";
import { addChildAction, deleteChildAction } from "@/lib/actions/account";

const fieldClass =
  "mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500";

type School = { id: number; name: string; grades: { id: number; label: string }[] };
type Child = { id: number; fullName: string; classSection: string | null; schoolName: string | null; gradeLabel: string | null };

export default function ChildrenSection({ childList, schools }: { childList: Child[]; schools: School[] }) {
  const [schoolId, setSchoolId] = useState("");
  const grades = schools.find((s) => String(s.id) === schoolId)?.grades ?? [];

  return (
    <section>
      <h2 className="text-sm font-semibold text-ink-900">Children</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs font-medium tracking-wide text-ink-400 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">School / Grade</th>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {childList.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 font-medium text-ink-900">{c.fullName}</td>
                <td className="px-4 py-2 text-ink-600">{c.schoolName ? `${c.schoolName} · ${c.gradeLabel}` : "—"}</td>
                <td className="px-4 py-2 text-ink-600">{c.classSection ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteChildAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-ink-400 hover:text-error">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {childList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-ink-400">
                  No saved children yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <form action={addChildAction} className="grid grid-cols-4 items-end gap-2 border-t border-line p-3">
          <div>
            <label className="block text-xs text-ink-400">Full name</label>
            <input name="full_name" required className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs text-ink-400">School (optional)</label>
            <select
              name="school_id"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className={fieldClass}
            >
              <option value="">—</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-400">Grade</label>
            <select name="grade_id" className={fieldClass} disabled={grades.length === 0}>
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-400">Class / section</label>
            <input name="class_section" className={fieldClass} />
          </div>
          <button
            type="submit"
            className="col-span-4 h-[38px] rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
          >
            Add child
          </button>
        </form>
      </div>
    </section>
  );
}
