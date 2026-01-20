export default function DashboardPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-slate-600">
        You are signed in. This protected route will host profile management and recommendations.
      </p>
    </div>
  );
}
