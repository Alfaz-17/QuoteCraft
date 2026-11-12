import Link from "next/link";

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F5] px-4 py-16">
      <article className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 sm:p-12 space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-xs font-bold text-[#0F766E] hover:underline">
            ← Back to QuoteCraft
          </Link>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500">Last updated: {updated}</p>
        </header>
        {sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">{s.heading}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
