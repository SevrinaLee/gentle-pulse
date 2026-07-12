export function BillingSection() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-indigo-deep">Free plan</p>
        <span className="text-xs px-2 py-1 rounded-full bg-rose-gold-light text-indigo-deep">
          Active
        </span>
      </div>
      <p className="text-sm text-indigo-deep/60">
        Gentle Pulse doesn&apos;t have paid plans yet — everything is free while
        we build. This is where billing management will live once that
        changes.
      </p>
    </div>
  );
}
