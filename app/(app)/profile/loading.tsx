export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 animate-pulse">
      <div className="px-5 pt-14 pb-5">
        <div className="h-2.5 w-16 bg-muted rounded-full mb-2" />
        <div className="h-9 w-28 bg-muted rounded-lg" />
      </div>
      {/* Avatar + name */}
      <div className="px-5 flex gap-4 items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded-full" />
          <div className="h-3.5 w-24 bg-muted rounded-full" />
        </div>
      </div>
      {/* Fields */}
      <div className="px-5 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  )
}
