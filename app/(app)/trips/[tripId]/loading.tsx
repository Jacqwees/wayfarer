export default function TripLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 animate-pulse">
      {/* Hero */}
      <div className="h-56 w-full bg-muted" />

      {/* Member strip */}
      <div className="px-5 py-4 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-9 h-9 rounded-full bg-muted" />
        ))}
      </div>

      {/* Balance widget */}
      <div className="mx-5 mb-4 h-16 bg-muted rounded-lg" />

      {/* Feature grid */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
