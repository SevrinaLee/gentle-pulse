export default function Loading() {
  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-20 space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-indigo-deep/10" />
        <div className="h-40 rounded-2xl bg-indigo-deep/5" />
        <div className="h-20 rounded-2xl bg-indigo-deep/5" />
        <div className="h-20 rounded-2xl bg-indigo-deep/5" />
      </div>
    </main>
  );
}
