import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-6 px-6 py-12">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              SIRA • RAG-powered academic advisor
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Guide every student to the right program.
            </h1>
            <p className="max-w-2xl text-lg text-slate-700">
              Capture rich profiles, run hybrid retrieval over curated university data, and
              deliver transparent, cite-backed recommendations powered by Mistral + LlamaIndex.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Profiles</p>
              <p className="text-sm text-slate-600">Multi-step wizard with drafts, Clerk-secured.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">RAG Engine</p>
              <p className="text-sm text-slate-600">Hybrid semantic + keyword search via Pinecone.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Insights</p>
              <p className="text-sm text-slate-600">Match scores and timelines ready for Chart.js.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
