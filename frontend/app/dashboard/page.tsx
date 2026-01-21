import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          You are signed in. Manage profiles and launch recommendation workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/profiles"
          className="rounded-xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/20"
        >
          <h2 className="text-lg font-semibold text-foreground">Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage student profiles, transcripts, and preferences.
          </p>
        </Link>
        <div className="rounded-xl border border-dashed border-border p-5 text-left text-sm text-muted-foreground">
          Recommendations dashboard coming soon.
        </div>
      </div>
    </div>
  );
}
