import NewSchoolForm from "./new-school-form";

export default function NewSchoolPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-ink-900">New school</h1>
      <p className="mt-1 text-sm text-ink-400">Add a school before entering its supply lists.</p>
      <NewSchoolForm />
    </div>
  );
}
