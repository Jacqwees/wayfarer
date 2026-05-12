export default function TripsLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 animate-pulse">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-28 bg-muted rounded-full" />
          <div className="h-9 w-36 bg-muted rounded-lg" />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted" />
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4 flex gap-3">
        <div className="h-8 w-24 bg-muted rounded-full" />
        <div className="h-8 w-20 bg-muted rounded-full" />
      </div>

      {/* Trip cards */}
      <div className="px-5 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 w-full bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
