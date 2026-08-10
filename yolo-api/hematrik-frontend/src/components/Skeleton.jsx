export function SkeletonCard() {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 space-y-3">
      <div className="h-3 w-20 rounded shimmer-bg" />
      <div className="h-8 w-16 rounded shimmer-bg" />
      <div className="h-2 w-24 rounded shimmer-bg" />
    </div>
  );
}

export function SkeletonBlock({ className = "h-40" }) {
  return <div className={`rounded-xl shimmer-bg ${className}`} />;
}
