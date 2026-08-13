"use client";

import { useState } from "react";
import { addChildAction, deleteChildAction } from "@/lib/actions/account";
import { inputClass } from "@/components/admin/form-controls";

type School = { id: number; name: string; grades: { id: number; label: string }[] };
type Child = { id: number; fullName: string; classSection: string | null; schoolName: string | null; gradeLabel: string | null };

export default function ChildrenSection({ childList, schools }: { childList: Child[]; schools: School[] }) {
  const [schoolId, setSchoolId] = useState("");
  const grades = schools.find((s) => String(s.id) === schoolId)?.grades ?? [];

  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-900">Children</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">School / Grade</th>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {childList.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 font-medium text-neutral-900">{c.fullName}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {c.schoolName ? `${c.schoolName} · ${c.gradeLabel}` : "—"}
                </td>
                <td className="px-4 py-2 text-neutral-600">{c.classSection ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteChildAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-neutral-500 hover:text-red-600">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {childList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-neutral-400">
                  No saved children yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <form action={addChildAction} className="grid grid-cols-4 items-end gap-2 border-t border-neutral-200 p-3">
          <div>
            <label className="block text-xs text-neutral-500">Full name</label>
            <input name="full_name" required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">School (optional)</label>
            <select
              name="school_id"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className={inputClass}
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
            <label className="block text-xs text-neutral-500">Grade</label>
            <select name="grade_id" className={inputClass} disabled={grades.length === 0}>
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Class / section</label>
            <input name="class_section" className={inputClass} />
          </div>
          <button
            type="submit"
            className="col-span-4 h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add child
          </button>
        </form>
      </div>
    </section>
  );
}
