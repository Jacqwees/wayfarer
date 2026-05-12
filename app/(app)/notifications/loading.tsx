export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 animate-pulse">
      <div className="px-5 pt-14 pb-5">
        <div className="h-2.5 w-24 bg-muted rounded-full mb-2" />
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>
      <div className="px-5 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-4 bg-card border border-border rounded-lg">
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted rounded-full w-3/4" />
              <div className="h-3 bg-muted rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
